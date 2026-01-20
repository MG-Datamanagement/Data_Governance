***To run the chatbot and data card microservices:***

1.create postgres database and create tables for store datasets, domains, tags, glossary terms, owners
2.store the entities by fetching data from graphiql endpoint(trigger sync api)
3.generate data card
4. chatbt service 

***commands:***

1. docker-compose up -d

verify all containers are runnning
2. docker ps

Endpoint: 8001 --> Datahub to postgres data syncing
Endpoint: 8005 --> Datacard and chatbot services


*** 3.Endpoint 8001:  call these APIs ***

**1. To create and initulaize database tables and schema structure  -->  /init-schema   (POST)
**2. To sync and store the data retrieved from the graphiql endpoint -->  /sync/full   (POST)
**3. (optional)To sync the datasets only -->  /sync/datasets  (POST)

to check endpoint health:  
**4. /health  (GET) 

to see to total entity stats :
**5. /stats   (GET)


*** 4. Endpoint 8005: call these APIs ***

**1. Sync the datasets with their properties --> /sync/blocking  (POST)
**2. To see sync status --> /sync/status  (POST)

**3. To generate the data card for particular Dataset using URN --> /generate-datacard/{urn}  (POST)
**4. To get the existing datacard for specific dataset using URN  --> /datacard/{urn}  (GET)

**5. API Endpoint for chat bot --> /chat   (POST)
**6. To see the Chatbot history --> /history   (GET)

**7. To delete the chat bot history --> /history   (DELETE)
 
**8. Health check endpoint --> /health   (GET)
**9. To get the db schema --> /schema   (GET)
