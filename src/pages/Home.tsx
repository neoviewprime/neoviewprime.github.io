/**
 * PAGE: Home (Início) — Corrigido para MainLayout
 *
 * Agora esta página contém APENAS o conteúdo principal.
 * O TopNavbar e o AppSidebar são controlados pelo MainLayout.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FloatingAssistant } from '@/components/FloatingAssistant';
import { CompanyCard } from '@/components/CompanyCard';
import { companies } from '@/data/mockData';

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      <div className="container mx-auto px-4 py-4 sm:px-6 sm:py-8">

        {/* HEADER DA PÁGINA (não é o TopNavbar) */}
        <h1 className="mb-2 text-xl font-bold text-foreground sm:text-2xl lg:text-3xl">
          Selecione uma Empresa
        </h1>

        <p className="mb-6 text-sm text-muted-foreground sm:mb-8 sm:text-base">
          Acesse rapidamente os relatórios e indicadores da empresa
        </p>

        {/* LISTA DE EMPRESAS */}
        <div className="grid gap-3 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <CompanyCard
              key={company.id}
              name={company.name}
              fullName={company.fullName}
              onClick={() => navigate(`/dashboard?company=${company.id}`)}
            />
          ))}
        </div>

      </div>

      {/* ASSISTENTE FLUTUANTE */}
      <FloatingAssistant
      currentLevel="companies"
      selectedCompanyId={undefined}
      selectedSupId={undefined}
      selectedMgmtId={undefined}
      selectedProjId={undefined}
    />
    </>
  );
};

export default Home;
