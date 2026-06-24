
INSERT INTO registry.modules
(code,name)
VALUES
('registry-engine','Registry Engine'),
('source-engine','Source Engine'),
('parser-engine','Parser Engine'),
('change-engine','Change Engine'),
('search-engine','Search Engine'),
('gst-module','GST Module');

INSERT INTO source.sources
(code,name,url,priority)
VALUES
(
 'cbic',
 'CBIC GST Schedule',
 'https://cbic-gst.gov.in',
 1
);

