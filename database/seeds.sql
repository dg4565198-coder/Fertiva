-- =============================================================================
-- FERTIVA: SEEDS E DADOS INICIAIS DE REFERÊNCIA
-- =============================================================================

-- 1. FONTES E MANUAIS TÉCNICOS REGIONAIS
INSERT INTO technical_sources (code, title, institution, edition_year, applicable_states, is_validated_for_bahia, validation_status_notes)
VALUES
('BAHIA_EXTREMO_SUL', 'Manual de Recomendação de Adubação e Calagem para o Estado da Bahia', 'EBDA / SEAGRI-BA', 2012, ARRAY['BA'], TRUE, 'Prioridade regional. Utilizada prioritariamente para o Extremo Sul da Bahia.'),
('CFSEMG_5APROX', 'Recomendações para o Uso de Corretivos e Fertilizantes em Minas Gerais - 5ª Aproximação', 'Comissão de Fertilidade do Solo do Estado de Minas Gerais (CFSEMG)', 1999, ARRAY['MG', 'BA'], TRUE, 'Referência metodológica amplamente calibrada para solos do bioma Cerrado e Mata Atlântica.'),
('INCAPER_5APROX', 'Manual de Recomendação de Calagem e Adubação para o Estado do Espírito Santo - 5ª Aproximação', 'Incaper', 2007, ARRAY['ES', 'BA'], TRUE, 'Referência alternativa aplicável especialmente para culturas perenes (café conilon e cacau) na divisa BA/ES.'),
('EMBRAPA_CERRADOS', 'Adubação Corretiva e de Manutenção para Solos do Cerrado', 'Embrapa Cerrados', 2004, ARRAY['BA', 'GO', 'MG'], TRUE, 'Referência para critérios de gessagem e dinâmica de fósforo.')
ON CONFLICT (code) DO NOTHING;

-- 2. FERTILIZANTES COMERCIAIS CADASTRADOS
INSERT INTO fertilizer_products (commercial_name, formulation, n_percent, p2o5_percent, k2o_percent, s_percent, ca_percent, mg_percent)
VALUES
('Ureia Agrícola', '45-00-00', 45.0, 0.0, 0.0, 0.0, 0.0, 0.0),
('Sulfato de Amônio', '21-00-00', 21.0, 0.0, 0.0, 24.0, 0.0, 0.0),
('Superfosfato Simples', '00-18-00', 0.0, 18.0, 0.0, 10.0, 18.0, 0.0),
('Superfosfato Triplo', '00-41-00', 0.0, 41.0, 0.0, 0.0, 12.0, 0.0),
('Fosfato Monoamônico (MAP)', '11-52-00', 11.0, 52.0, 0.0, 0.0, 0.0, 0.0),
('Cloreto de Potássio (KCl)', '00-00-60', 0.0, 0.0, 60.0, 0.0, 0.0, 0.0),
('Formulado NPK 04-14-08', '04-14-08', 4.0, 14.0, 8.0, 5.0, 6.0, 0.0),
('Formulado NPK 20-00-20', '20-00-20', 20.0, 0.0, 20.0, 0.0, 0.0, 0.0),
('Formulado NPK 20-05-20', '20-05-20', 20.0, 5.0, 20.0, 0.0, 0.0, 0.0);
