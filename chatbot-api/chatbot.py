from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv
import json

load_dotenv()
app = FastAPI(title="AI DataHub Chatbot")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# Gemini LLM
llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-pro",
    google_api_key=os.getenv("GEMINI_API_KEY"),
    temperature=0
)

PG_CONFIG = {
    "host": "postgres", "port": 5432, "database": "semantic_search",
    "user": "semantic_user", "password": "semantic_pass"
}

def safe_execute(sql: str):
    """Execute SQL safely"""
    try:
        conn = psycopg2.connect(**PG_CONFIG, connect_timeout=10)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(sql)
        if cur.description:
            results = cur.fetchall()
        else:
            results = [{"message": "Query executed", "rows_affected": cur.rowcount}]
        conn.close()
        return results
    except Exception as e:
        return f"Database error: {str(e)}"

@app.get("/health")
def health():
    results = safe_execute("SELECT COUNT(*) as total_datasets FROM dh_dataset LIMIT 1")
    return {"status": "healthy", "datasets": results[0] if isinstance(results, list) else results}

class ChatRequest(BaseModel):
    question: str

@app.post("/chat")
async def chat(req: ChatRequest):
    try:
        # LLM generates SQL
        sql_prompt = f"""
        Schema: dh_dataset(urn,name,platformname,description,domainurn), dh_domain(urn,name), dh_tag(urn,name), dh_entitytag(entityurn,tagurn)
        
        Question: "{req.question}"
        
        Write SAFE PostgreSQL query (SELECT only, LIMIT 20). Use COUNT(*), GROUP BY, ORDER BY.
        Return ONLY the SQL query, no explanation:
        """
        
        sql_response = llm.invoke(sql_prompt)
        sql = sql_response.content.strip()
        
        # Safety filter
        if any(op in sql.upper() for op in ["DELETE", "DROP", "UPDATE", "INSERT"]):
            sql = "SELECT 'Blocked unsafe query' as warning;"
        
        # Execute
        results = safe_execute(sql)
        
        # LLM summarizes
        summary_prompt = f"""
        Question: {req.question}
        SQL: {sql}
        Results: {json.dumps(results[:10], default=str)}
        
        Answer conversationally in 2 sentences. Use numbers/tables. Be precise.
        """
        
        answer = llm.invoke(summary_prompt).content
        
        return {
            "question": req.question,
            "answer": answer,
            "sql_generated": sql,
            "results_preview": str(results[:3]),
            "status": "success"
        }
        
    except Exception as e:
        return {
            "question": req.question,
            "answer": f"Sorry, something went wrong: {str(e)}",
            "status": "error"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
