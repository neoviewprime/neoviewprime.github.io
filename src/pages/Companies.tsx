/**
 * ============================================================
 * PAGE: Companies - Corrigido para MainLayout
 * ============================================================
 *
 * Agora esta página não renderiza TopNavbar/Sidebar/ChatWidget.
 * O layout global é controlado pelo MainLayout.
 * Mantém toda a lógica de carregamento e exibição de empresas.
 * ============================================================
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Building2,
  Search,
  Plus,
  MoreVertical,
  Users,
  FolderTree,
  FileText,
  Edit,
  Trash2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { companies as mockCompanies } from '@/data/mockData';
import type { CompanyEntity } from '@/types/backend';
import { FloatingAssistant } from '@/components/FloatingAssistant';

const Companies: React.FC = () => {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [companies, setCompanies] = useState<CompanyEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Simular carregamento de dados
  useEffect(() => {
    const loadCompanies = async () => {
      setIsLoading(true);
      // TODO: Substituir por chamada real ao backend HANA

      await new Promise((resolve) => setTimeout(resolve, 500));

      // Converter mock data para formato de entidade
      const entityCompanies: CompanyEntity[] = mockCompanies.map((c) => ({
        id: c.id,
        name: c.name,
        full_name: c.fullName,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      setCompanies(entityCompanies);
      setIsLoading(false);
    };

    loadCompanies();
  }, []);

  const filteredCompanies = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Estatísticas mock - TODO: buscar do backend
  const getCompanyStats = (companyId: string) => {
    const mockData = mockCompanies.find((c) => c.id === companyId);
    if (!mockData) return { superintendences: 0, reports: 0, users: 0 };

    let reports = 0;
    mockData.superintendences.forEach((s) => {
      s.managements.forEach((m) => {
        m.projects.forEach((p) => {
          p.indicators.forEach((i) => {
            reports += i.reports.length;
          });
        });
      });
    });

    return {
      superintendences: mockData.superintendences.length,
      reports,
      users: Math.floor(Math.random() * 50) + 10,
    };
  };

  return (
    <>
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Empresas</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie as empresas do grupo Neoenergia
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Nova Empresa
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar empresas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 max-w-md"
          />
        </div>

        {/* Companies Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-3">
                  <div className="h-6 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="h-16 bg-muted rounded"></div>
                    <div className="h-16 bg-muted rounded"></div>
                    <div className="h-16 bg-muted rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.map((company) => {
              const stats = getCompanyStats(company.id);

              return (
                <Card
                  key={company.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/dashboard?company=${company.id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <CardTitle className="text-lg">{company.name}</CardTitle>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{company.full_name}</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-2 bg-muted/50 rounded-lg">
                        <FolderTree className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-lg font-semibold">{stats.superintendences}</p>
                        <p className="text-xs text-muted-foreground">Superint.</p>
                      </div>

                      <div className="text-center p-2 bg-muted/50 rounded-lg">
                        <FileText className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-lg font-semibold">{stats.reports}</p>
                        <p className="text-xs text-muted-foreground">Relatórios</p>
                      </div>

                      <div className="text-center p-2 bg-muted/50 rounded-lg">
                        <Users className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-lg font-semibold">{stats.users}</p>
                        <p className="text-xs text-muted-foreground">Usuários</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredCompanies.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma empresa encontrada</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'Tente uma busca diferente' : 'Adicione sua primeira empresa'}
            </p>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nova Empresa
            </Button>
          </div>
        )}
      </div>

      {/* Floating Assistant */}
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

export default Companies;
