from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey, Text, Boolean,
    UniqueConstraint, Index
)
from sqlalchemy.orm import relationship, Session
from sqlalchemy.sql import func

from ..core.database import Base
from .resource_urn import URNGenerator, Environment, ResourceType


class Tag(Base):
    """Tag model for categorizing data assets."""
    
    __tablename__ = "tags"
    
    id = Column(Integer, primary_key=True, index=True)
    urn = Column(String(500), unique=True, nullable=True, index=True)  # Resource URN
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    color = Column(String(7), nullable=True)  # Hex color code
    
    # Hierarchical tags
    parent_tag_id = Column(Integer, ForeignKey("tags.id"), nullable=True, index=True)
    
    # Tag metadata
    is_system_tag = Column(Boolean, default=False, nullable=False)  # System vs user tags
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Environment
    environment = Column(String(20), default="PROD", nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    parent_tag = relationship("Tag", remote_side=[id], backref="child_tags")
    table_tags = relationship("TableTag", back_populates="tag")
    column_tags = relationship("ColumnTag", back_populates="tag")
    
    def __repr__(self):
        return f"<Tag(id={self.id}, name='{self.name}', parent_id={self.parent_tag_id}, urn='{self.urn}')>"
    
    def generate_urn(self) -> str:
        """Generate URN for this tag."""
        if not self.urn:
            self.urn = URNGenerator.generate_tag_urn(
                tag_name=self.name,
                environment=Environment.PROD if self.environment == "PROD" else Environment.DEV
            )
        return self.urn
    
    @property
    def full_name(self) -> str:
        """Get full hierarchical tag name."""
        if self.parent_tag:
            return f"{self.parent_tag.full_name} > {self.name}"
        return self.name


class TableTag(Base):
    """Many-to-many relationship between tables and tags."""
    
    __tablename__ = "table_tags"
    
    table_id = Column(Integer, ForeignKey("tables.id"), primary_key=True, index=True)
    tag_id = Column(Integer, ForeignKey("tags.id"), primary_key=True, index=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Tag metadata
    confidence_score = Column(Integer, nullable=True)  # 0-100 for auto-tagged items
    is_auto_tagged = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    table = relationship("Table", back_populates="tags")
    tag = relationship("Tag", back_populates="table_tags")
    creator = relationship("User", back_populates="created_tags")
    
    def __repr__(self):
        return f"<TableTag(table_id={self.table_id}, tag_id={self.tag_id})>"


class ColumnTag(Base):
    """Many-to-many relationship between columns and tags."""
    
    __tablename__ = "column_tags"
    
    column_id = Column(Integer, ForeignKey("columns.id"), primary_key=True, index=True)
    tag_id = Column(Integer, ForeignKey("tags.id"), primary_key=True, index=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Tag metadata
    confidence_score = Column(Integer, nullable=True)  # 0-100 for auto-tagged items
    is_auto_tagged = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    column = relationship("Column", back_populates="tags")
    tag = relationship("Tag", back_populates="column_tags")
    creator = relationship("User")
    
    def __repr__(self):
        return f"<ColumnTag(column_id={self.column_id}, tag_id={self.tag_id})>"


class BusinessGlossary(Base):
    """Business glossary model for terminology management."""
    
    __tablename__ = "business_glossary"
    
    id = Column(Integer, primary_key=True, index=True)
    term = Column(String(255), unique=True, nullable=False, index=True)
    definition = Column(Text, nullable=False)
    business_definition = Column(Text, nullable=True)
    technical_definition = Column(Text, nullable=True)
    
    # Ownership and approval
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    is_approved = Column(Boolean, default=False, nullable=False)
    
    # Related terms
    synonyms = Column(Text, nullable=True)  # Comma-separated list
    acronyms = Column(Text, nullable=True)  # Comma-separated list
    
    # Categories
    category = Column(String(100), nullable=True, index=True)
    domain_id = Column(Integer, ForeignKey("domains.id"), nullable=True, index=True)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    owner = relationship("User", foreign_keys=[owner_id])
    approver = relationship("User", foreign_keys=[approved_by])
    domain = relationship("Domain")
    
    def __repr__(self):
        return f"<BusinessGlossary(id={self.id}, term='{self.term}', is_approved={self.is_approved})>"


class DataClassification(Base):
    """Data classification rules and patterns."""
    
    __tablename__ = "data_classifications"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    
    # Classification rules
    pattern = Column(String(500), nullable=True)  # Regex pattern for column names
    data_type_patterns = Column(Text, nullable=True)  # JSON array of data type patterns
    value_patterns = Column(Text, nullable=True)  # JSON array of value patterns
    
    # Classification metadata
    sensitivity_level = Column(String(50), nullable=False)
    pii_category = Column(String(100), nullable=True)
    compliance_tags = Column(Text, nullable=True)  # JSON array of compliance requirements
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    auto_apply = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    def __repr__(self):
        return f"<DataClassification(id={self.id}, name='{self.name}', sensitivity='{self.sensitivity_level}')>"