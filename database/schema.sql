-- =============================================================================
-- FERTIVA: ESQUEMA DE BANCO DE DADOS (PostgreSQL 16 / Supabase)
-- Versão 1.0 - Em estrita conformidade com a Especificação Técnica
-- =============================================================================

-- Habilita extensão para UUID v4
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMS E TIPOS CUSTOMIZADOS
CREATE TYPE user_role AS ENUM ('produtor', 'estudante', 'profissional', 'admin');
CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'consultoria');
CREATE TYPE calculation_type_enum AS ENUM ('calagem', 'gessagem', 'adubacao');
CREATE TYPE nutrient_status_enum AS ENUM ('muito_baixo', 'baixo', 'medio', 'bom', 'muito_alto');
CREATE TYPE crop_cycle_enum AS ENUM ('anual', 'perene', 'semi_perene');

-- 2. PERFIS DE USUÁRIO (Espelha auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    crea_crmv TEXT,
    phone TEXT,
    role user_role DEFAULT 'produtor',
    tier subscription_tier DEFAULT 'free',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PROPRIEDADES RURAIS
CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    total_area_ha NUMERIC(10,2) NOT NULL CHECK (total_area_ha > 0),
    state CHAR(2) NOT NULL DEFAULT 'BA',
    city TEXT NOT NULL,
    latitude NUMERIC(10,6),
    longitude NUMERIC(10,6),
    is_demo BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TALHÕES
CREATE TABLE IF NOT EXISTS plots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    area_ha NUMERIC(10,2) NOT NULL CHECK (area_ha > 0),
    current_crop TEXT,
    previous_crop TEXT,
    soil_texture_declared TEXT, -- 'Argiloso', 'Textura Média', 'Arenoso'
    slope_percent NUMERIC(5,2),
    is_demo BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. AMOSTRAGENS / LAUDOS DE SOLO
CREATE TABLE IF NOT EXISTS soil_samples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plot_id UUID NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
    lab_name TEXT,
    lab_report_number TEXT,
    sample_date DATE NOT NULL,
    analysis_date DATE,
    depth_start_cm INT NOT NULL DEFAULT 0,
    depth_end_cm INT NOT NULL DEFAULT 20,
    extracted_via_ocr BOOLEAN DEFAULT FALSE,
    ocr_confirmed_by_user BOOLEAN DEFAULT FALSE,
    file_path TEXT, -- URI do arquivo PDF no storage privado
    is_demo BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. RESULTADOS ANALÍTICOS (QUÍMICOS E FÍSICOS)
CREATE TABLE IF NOT EXISTS soil_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sample_id UUID NOT NULL REFERENCES soil_samples(id) ON DELETE CASCADE,
    attribute_name TEXT NOT NULL, -- 'ph_h2o', 'p_mehlich1', 'k', 'ca', 'mg', 'al', 'h_al', 'mo', etc.
    numeric_value NUMERIC(12,4) NOT NULL,
    unit TEXT NOT NULL, -- 'mg/dm3', 'cmol_c/dm3', '%', 'g/kg'
    method_details TEXT, -- Identificação do extrator (ex: Mehlich-1, KCl 1M, SMP)
    is_calculated_derived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. FONTES E MANUAIS TÉCNICOS REGIONAIS
CREATE TABLE IF NOT EXISTS technical_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL, -- 'CFSEMG_5APROX', 'INCAPER_5APROX', 'BAHIA_VALIDADA', 'EMBRAPA_CERRADO'
    title TEXT NOT NULL,
    institution TEXT NOT NULL,
    edition_year INT NOT NULL,
    applicable_states TEXT[] NOT NULL,
    is_validated_for_bahia BOOLEAN DEFAULT FALSE,
    validation_status_notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. REGRAS DE INTERPRETAÇÃO DE FERTILIDADE
CREATE TABLE IF NOT EXISTS interpretation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID NOT NULL REFERENCES technical_sources(id) ON DELETE CASCADE,
    attribute_name TEXT NOT NULL,
    extractor_method TEXT,
    min_clay_percent NUMERIC(5,2),
    max_clay_percent NUMERIC(5,2),
    class_label nutrient_status_enum NOT NULL,
    min_value NUMERIC(12,4),
    max_value NUMERIC(12,4),
    unit TEXT NOT NULL,
    agronomic_explanation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. REGRAS DE RECOMENDAÇÃO (CALAGEM, GESSAGEM, ADUBAÇÃO)
CREATE TABLE IF NOT EXISTS recommendation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID NOT NULL REFERENCES technical_sources(id) ON DELETE CASCADE,
    crop_code TEXT NOT NULL, -- 'milho', 'cafe', 'mandioca', 'cacau', 'pastagem', 'eucalipto'
    calculation_type calculation_type_enum NOT NULL,
    rule_version TEXT NOT NULL DEFAULT '1.0',
    target_parameters JSONB NOT NULL, -- ex: { "target_v_percent": 60 }
    parameters_formula JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. PRODUTOS E FORMULAÇÕES DE FERTILIZANTES
CREATE TABLE IF NOT EXISTS fertilizer_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    commercial_name TEXT NOT NULL,
    formulation TEXT NOT NULL, -- '45-00-00', '00-18-00', '00-00-60', '04-14-08'
    n_percent NUMERIC(5,2) DEFAULT 0,
    p2o5_percent NUMERIC(5,2) DEFAULT 0,
    k2o_percent NUMERIC(5,2) DEFAULT 0,
    s_percent NUMERIC(5,2) DEFAULT 0,
    ca_percent NUMERIC(5,2) DEFAULT 0,
    mg_percent NUMERIC(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

-- 11. REGISTRO IMUTÁVEL DE CÁLCULOS E MEMÓRIA
CREATE TABLE IF NOT EXISTS calculation_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sample_id UUID NOT NULL REFERENCES soil_samples(id),
    user_id UUID NOT NULL REFERENCES profiles(id),
    calculation_type calculation_type_enum NOT NULL,
    source_id UUID NOT NULL REFERENCES technical_sources(id),
    source_version_snapshot TEXT NOT NULL,
    input_parameters JSONB NOT NULL,
    output_results JSONB NOT NULL,
    calculation_memory JSONB NOT NULL,
    limitations_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. RELATÓRIOS E LAUDOS EMITIDOS
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    calculation_id UUID NOT NULL REFERENCES calculation_records(id),
    user_id UUID NOT NULL REFERENCES profiles(id),
    report_code TEXT UNIQUE NOT NULL,
    pdf_storage_path TEXT,
    snapshot_rules JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. AUDITORIA E LOGS DE ALTERAÇÃO DE REGRAS
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    action TEXT NOT NULL,
    target_table TEXT NOT NULL,
    target_record_id UUID,
    before_state JSONB,
    after_state JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- POLÍTICAS DE SEGURANÇA ROW LEVEL SECURITY (RLS)
-- =============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuários podem visualizar e editar apenas seu próprio perfil"
    ON profiles FOR ALL USING (auth.uid() = id);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuários acessam apenas suas propriedades cadastradas"
    ON properties FOR ALL USING (auth.uid() = user_id);

ALTER TABLE plots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuários acessam apenas talhões pertencentes às suas propriedades"
    ON plots FOR ALL USING (
        EXISTS (
            SELECT 1 FROM properties
            WHERE properties.id = plots.property_id
            AND properties.user_id = auth.uid()
        )
    );

ALTER TABLE soil_samples ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuários acessam apenas análises de seus talhões"
    ON soil_samples FOR ALL USING (
        EXISTS (
            SELECT 1 FROM plots
            JOIN properties ON properties.id = plots.property_id
            WHERE plots.id = soil_samples.plot_id
            AND properties.user_id = auth.uid()
        )
    );

ALTER TABLE soil_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuários acessam apenas resultados de suas amostras"
    ON soil_results FOR ALL USING (
        EXISTS (
            SELECT 1 FROM soil_samples
            JOIN plots ON plots.id = soil_samples.plot_id
            JOIN properties ON properties.id = plots.property_id
            WHERE soil_samples.id = soil_results.sample_id
            AND properties.user_id = auth.uid()
        )
    );

ALTER TABLE calculation_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuários acessam apenas cálculos gerados por eles"
    ON calculation_records FOR ALL USING (auth.uid() = user_id);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuários acessam apenas relatórios de suas análises"
    ON reports FOR ALL USING (auth.uid() = user_id);

-- Tabelas de referência técnica pública (leitura aberta, escrita restrita a admins)
ALTER TABLE technical_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Fontes técnicas são visíveis para todos os autenticados"
    ON technical_sources FOR SELECT USING (auth.role() = 'authenticated');

ALTER TABLE interpretation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Regras de interpretação são visíveis para todos os autenticados"
    ON interpretation_rules FOR SELECT USING (auth.role() = 'authenticated');
