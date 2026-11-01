# 🌾 FERTIVA — Inteligência em Fertilidade do Solo

> **Solo bem nutrido. Produção mais forte.**  
> Plataforma digital de interpretação de análises de solo, diagnóstico da fertilidade e apoio ao planejamento de calagem, gessagem e adubação, com foco inicial na Bahia e Extremo Sul.

[![GitHub Pages CI/CD](https://github.com/dg4565198-coder/Fertiva/actions/workflows/deploy.yml/badge.svg)](https://github.com/dg4565198-coder/Fertiva/actions/workflows/deploy.yml)
[![Firebase Ready](https://img.shields.io/badge/Firebase-Auth%20%26%20Firestore-orange)](https://firebase.google.com/)

---

## 🌐 Links do Projeto

- **Repositório GitHub**: [https://github.com/dg4565198-coder/Fertiva.git](https://github.com/dg4565198-coder/Fertiva.git)
- **Publicação Web (GitHub Pages)**: [https://dg4565198-coder.github.io/Fertiva/](https://dg4565198-coder.github.io/Fertiva/)
- **Ambiente de Teste / Demonstração**: Hospedagem contínua via CI/CD e Cloudflare Tunnel.

---

## ✨ Funcionalidades Principais

1. **Leitura Automática de Laudos (OCR + PDF Nativo)**:
   - Anexe o arquivo PDF ou foto do laudo (celular ou computador).
   - Extração instantânea do laboratório (Fullin, SoloBahia, Agrolab, etc.), número do laudo, data e todos os teores químicos ($pH$, $P$, $K$, $Ca$, $Mg$, $Al$, $H+Al$, $M.O.$, argila).
   - Preenchimento 100% automático para o produtor apenas conferir lado a lado e salvar em 1 clique.

2. **Diagnóstico Determinístico da Fertilidade**:
   - Cálculos estritos de Soma de Bases ($SB$), $CTC$ efetiva ($t$), $CTC$ a pH 7 ($T$), Saturação por Bases ($V\%$) e Saturação por Alumínio ($m\%$).
   - Visão Produtor (diagnóstico semáforo intuitivo) e Visão Profissional (tabela técnica detalhada).

3. **Recomendações Auditáveis (Calagem, Gessagem e NPK)**:
   - **Calagem**: Método de Elevação da Saturação por Bases com memória de cálculo auditável e PRNT.
   - **Gessagem**: Trava de segurança obrigatória para análise subsuperficial ($20-40\text{ cm}$) segundo critérios de Sousa & Lobato (Embrapa).
   - **Adubação**: Formulações comerciais e doses por hectare para Milho, Café, Cacau, Mandioca, Pastagens e Eucalipto.

4. **Autenticação, Governança & Firebase**:
   - Perfis de acesso: Produtor Rural, Agrônomo/Profissional e Administrador Geral exclusivo para **Guilherme**.
   - Integração completa com **Firebase Auth** (Login por E-mail/Senha e Conta Google) e **Cloud Firestore** para sincronização em nuvem em tempo real.
   - Painel Administrativo exclusivo para controle de usuários, planos e regras agronômicas.

---

## 🌾 Estrutura do Projeto

```
fertiva/
├── .github/workflows/deploy.yml # CI/CD automatizado no GitHub Actions
├── firebase.json                # Configuração do Firebase Hosting e Firestore
├── .firebaserc                  # Alias do projeto Firebase (fertiva-agro)
├── atualizar_fertiva.bat        # Script de 1 clique para sincronizar atualizações no GitHub
│
├── frontend/                    # Aplicação Web Responsiva & PWA (React 19 + TypeScript + Tailwind CSS)
│   ├── src/
│   │   ├── components/          # Header, Sidebar, AuthModal (com Google & Firebase)
│   │   ├── views/               # Dashboard, Entrada com OCR, Interpretação, Calagem, Adubação, Admin
│   │   ├── lib/                 # agronomicEngine.ts, pdfExtractor.ts, firebase.ts
│   │   └── types/               # Tipos e modelos agronômicos
│   └── package.json
│
├── engine/                      # Motor Agronômico Determinístico em Python (FastAPI + Pytest)
│   ├── src/fertiva_engine/      # soil_math.py, liming.py, gypsum.py, fertilization.py
│   └── tests/                   # Bateria completa de testes automatizados
│
└── database/                    # Esquema Relacional e Regras de Nuvem
    ├── schema.sql               # DDL PostgreSQL / Supabase
    ├── seeds.sql                # Dados bibliográficos e adubos
    └── firestore.rules          # Regras de segurança do Firestore
```

---

## 🚀 Como Sincronizar Atualizações no GitHub

Para subir qualquer nova melhoria ou alteração diretamente para o GitHub:

1. **Pelo script automático**:
   - Dê um duplo clique no arquivo `atualizar_fertiva.bat` na raiz do projeto.
2. **Ou via terminal**:
   ```powershell
   git add .
   git commit -m "feat: melhorias no sistema"
   git push origin main
   ```
O GitHub Actions irá compilar automaticamente e atualizar a versão online em minutos!
