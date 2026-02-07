'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Input, Button } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Search, 
  Mail, 
  Phone, 
  ShoppingBag,
  Download,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { hasFeature } from '@/lib/plan';
import { ProBadge } from '@/components/shared/pro-gate';
import { exportCustomers, type Customer } from '@/actions/customers';
import type { PlanType } from '@/types';
import { useTranslations } from 'next-intl';

interface CustomersListProps {
  initialCustomers: Customer[];
  plan: PlanType;
}

export function CustomersList({ initialCustomers, plan }: CustomersListProps) {
  const canExport = hasFeature(plan, 'export_csv');
  const [customers] = useState<Customer[]>(initialCustomers);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const t = useTranslations('Customers');

  const filteredCustomers = customers.filter(c => 
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone && c.phone.includes(searchTerm))
  );

  const handleExport = async () => {
    setExporting(true);
    try {
      const result = await exportCustomers();
      if (result.success && result.csv) {
        const blob = new Blob(['\ufeff' + result.csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `customers_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Stats
  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce((sum, c) => sum + c.total_spent, 0);
  const avgOrderValue = totalRevenue / customers.reduce((sum, c) => sum + c.total_orders, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('title')}</h2>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        {canExport ? (
          <Button onClick={handleExport} disabled={exporting || customers.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            {exporting ? t('exporting') : t('exportCSV')}
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button disabled variant="outline">
              <Download className="h-4 w-4 mr-2" />
              {t('exportCSV')}
            </Button>
            <ProBadge />
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('totalCustomers')}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('totalRevenue')}
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatPrice(totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('avgOrderValue')}
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(avgOrderValue)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Customer List */}
      {filteredCustomers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            {customers.length === 0 ? (
              <>
                <h3 className="font-semibold mb-2">{t('noCustomersYet')}</h3>
                <p className="text-muted-foreground">{t('noCustomersYetDesc')}</p>
              </>
            ) : (
              <>
                <h3 className="font-semibold mb-2">{t('noCustomersFound')}</h3>
                <p className="text-muted-foreground">{t('noCustomersFoundDesc')}</p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredCustomers.map((customer) => (
            <Card key={customer.email}>
              <CardContent className="p-4">
                {/* Main Info */}
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedEmail(
                    expandedEmail === customer.email ? null : customer.email
                  )}
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-semibold">
                        {customer.name.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* Name & Email */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{customer.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {t('ordersCount', { count: customer.total_orders })}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {customer.email}
                        </span>
                        {customer.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {customer.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        {formatPrice(customer.total_spent)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('lastPurchase', { date: formatDate(customer.last_order_at) })}
                      </p>
                    </div>
                    {expandedEmail === customer.email ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedEmail === customer.email && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Stats */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">{t('stats')}</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="p-2 rounded-lg bg-muted">
                            <p className="text-muted-foreground">{t('firstPurchase')}</p>
                            <p className="font-medium">{formatDate(customer.first_order_at)}</p>
                          </div>
                          <div className="p-2 rounded-lg bg-muted">
                            <p className="text-muted-foreground">{t('lastPurchaseLabel')}</p>
                            <p className="font-medium">{formatDate(customer.last_order_at)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Products */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">{t('productsBought')}</h4>
                        <div className="flex flex-wrap gap-2">
                          {customer.products_bought.map((product, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {product}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`mailto:${customer.email}`, '_blank');
                        }}
                      >
                        <Mail className="h-3 w-3 mr-1" />
                        {t('sendEmail')}
                      </Button>
                      {customer.phone && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`tel:${customer.phone}`, '_blank');
                          }}
                        >
                          <Phone className="h-3 w-3 mr-1" />
                          {t('call')}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
