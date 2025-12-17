class {{EntityName}}Model(SQLModel, table=True):
    """{{EntityDescription}} database model"""
    __tablename__ = "{{EntityNamePluralLower}}"
    metadata = operational_metadata
    
    id: str = Field(primary_key=True, default_factory=generate_id)
    tenant_id: str = Field(index=True)
    code: str = Field(index=True)
    name: str{{ModelFields}}
    is_active: bool = Field(default=True, index=True)
    is_deleted: bool = Field(default=False, index=True)  # Soft delete flag
    version: int = Field(default=0)
    
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True))
    )
    deleted_at: Optional[datetime] = Field(  # When soft deleted
        default=None,
        sa_column=Column(DateTime(timezone=True))
    )
    
    __table_args__ = (
        Index('ix_{{tableName}}_tenant_code', 'tenant_id', 'code', unique=True),
        Index('ix_{{tableName}}_tenant_active', 'tenant_id', 'is_active'),
        Index('ix_{{tableName}}_tenant_deleted', 'tenant_id', 'is_deleted'),  # For filtering deleted records
    )

