-- 更新名言弹窗间隔为0（每次都显示）
UPDATE system_config SET value = '0' WHERE key = 'quote_popup_interval';