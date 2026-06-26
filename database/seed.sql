-- Seed Core Modules
INSERT INTO registry.modules (code, name, enabled, configuration) VALUES
('hsn_master', 'HSN Master Module', true, '{}'::jsonb),
('sac_master', 'SAC Master Module', true, '{}'::jsonb),
('notification_tracker', 'Notification Tracker', true, '{}'::jsonb),
('state_rules', 'State Rules Module', true, '{}'::jsonb),
('search', 'Search Module', true, '{}'::jsonb)
ON CONFLICT (code) DO NOTHING;

-- Seed Default Sources
INSERT INTO source.sources (code, name, url, type, priority, enabled, configuration) VALUES
(
    'cbic_hsn_schedule',
    'CBIC HSN Schedule',
    'https://cbic-gst.gov.in/pdf/chapter-wise-rate-wise-gst-schedule-18.05.2017.pdf',
    'pdf',
    100,
    true,
    '{"document_code": "gst_schedule_goods"}'::jsonb
),
(
    'cbic_notifications',
    'CBIC GST Notifications',
    'https://cbic-gst.gov.in/gst-notifications.html',
    'html',
    90,
    true,
    '{}'::jsonb
)
ON CONFLICT (code) DO NOTHING;

-- Seed Sample HSN Data
INSERT INTO gst.hsn_master (hsn_code, description, cgst, sgst, igst, effective_date, notification_no, active) VALUES
('8517', 'Telephone sets, including smartphones', 9.0, 9.0, 18.0, '2017-07-01', '1/2017', true),
('8528', 'Monitors and projectors', 9.0, 9.0, 18.0, '2017-07-01', '1/2017', true),
('8471', 'Computers and parts', 9.0, 9.0, 18.0, '2017-07-01', '1/2017', true),
('1001', 'Wheat and meslin', 0.0, 0.0, 0.0, '2017-07-01', '1/2017', true),
('0901', 'Coffee', 2.5, 2.5, 5.0, '2017-07-01', '1/2017', true)
ON CONFLICT DO NOTHING;
