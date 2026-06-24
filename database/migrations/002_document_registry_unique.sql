
ALTER TABLE source.document_registry
ADD CONSTRAINT uq_document_code
UNIQUE(document_code);

