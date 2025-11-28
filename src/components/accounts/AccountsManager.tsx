import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAccounts } from '@/hooks/accounts/useAccounts';
import { Plus, Search, Edit, Trash2, DollarSign, Calendar, User, Building } from 'lucide-react';
import type { CreateAccountData, UpdateAccountData, Account } from '@/types/accounts';

export function AccountsManager() {
  const { toast } = useToast();
  const {
    accounts,
    loading,
    error,
    createAccount,
    updateAccount,
    deleteAccount,
    getAccountSummary,
    getOverdueAccounts,
    searchAccounts,
    getAccountsByType,
    getAccountsByStatus,
    getTotalOutstandingBalance,
    getTotalInvoicedAmount,
    getTotalPaidAmount
  } = useAccounts();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [overdueAccounts, setOverdueAccounts] = useState<any[]>([]);

  // Form state
  const [formData, setFormData] = useState<CreateAccountData>({
    account_name: '',
    account_type: 'client',
    client_name: '',
    client_email: '',
    client_phone: '',
    payment_terms: 30,
    credit_limit: 0,
    currency: 'USD',
    billing_frequency: 'monthly',
    auto_invoice: false,
    tax_exempt: false,
    tax_rate: 0,
    tags: [],
    metadata: {}
  });

  const handleCreateAccount = async () => {
    const account = await createAccount(formData);
    if (account) {
      toast({
        title: 'Account Created',
        description: `Account ${account.account_number} has been created successfully.`,
      });
      setIsCreateDialogOpen(false);
      setFormData({
        account_name: '',
        account_type: 'client',
        client_name: '',
        client_email: '',
        client_phone: '',
        payment_terms: 30,
        credit_limit: 0,
        currency: 'USD',
        billing_frequency: 'monthly',
        auto_invoice: false,
        tax_exempt: false,
        tax_rate: 0,
        tags: [],
        metadata: {}
      });
    }
  };

  const handleUpdateAccount = async () => {
    if (!selectedAccount) return;
    
    const updatedAccount = await updateAccount(selectedAccount.id, formData);
    if (updatedAccount) {
      toast({
        title: 'Account Updated',
        description: `Account ${updatedAccount.account_number} has been updated successfully.`,
      });
      setIsEditDialogOpen(false);
      setSelectedAccount(null);
    }
  };

  const handleDeleteAccount = async (account: Account) => {
    if (confirm(`Are you sure you want to delete account ${account.account_number}?`)) {
      const success = await deleteAccount(account.id);
      if (success) {
        toast({
          title: 'Account Deleted',
          description: `Account ${account.account_number} has been deleted.`,
        });
      }
    }
  };

  const handleEditAccount = (account: Account) => {
    setSelectedAccount(account);
    setFormData({
      account_name: account.account_name,
      account_type: account.account_type,
      client_name: account.client_name || '',
      client_email: account.client_email || '',
      client_phone: account.client_phone || '',
      payment_terms: account.payment_terms,
      credit_limit: account.credit_limit,
      currency: account.currency,
      billing_frequency: account.billing_frequency,
      auto_invoice: account.auto_invoice,
      tax_exempt: account.tax_exempt,
      tax_rate: account.tax_rate,
      tags: account.tags,
      metadata: account.metadata
    });
    setIsEditDialogOpen(true);
  };

  const loadOverdueAccounts = async () => {
    const overdue = await getOverdueAccounts(30);
    setOverdueAccounts(overdue);
  };

  React.useEffect(() => {
    loadOverdueAccounts();
  }, []);

  const filteredAccounts = searchQuery 
    ? accounts.filter(account => 
        account.account_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.account_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.client_email?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : accounts;

  const clientAccounts = getAccountsByType('client');
  const vendorAccounts = getAccountsByType('vendor');
  const activeAccounts = getAccountsByStatus('active');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Accounts Management</h1>
          <p className="text-muted-foreground">Manage client and vendor accounts</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Account
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Account</DialogTitle>
            </DialogHeader>
            <AccountForm 
              formData={formData} 
              setFormData={setFormData} 
              onSubmit={handleCreateAccount}
              submitLabel="Create Account"
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Accounts</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accounts.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${getTotalOutstandingBalance().toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoiced</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${getTotalInvoicedAmount().toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Accounts</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdueAccounts.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search accounts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Accounts ({accounts.length})</TabsTrigger>
          <TabsTrigger value="clients">Clients ({clientAccounts.length})</TabsTrigger>
          <TabsTrigger value="vendors">Vendors ({vendorAccounts.length})</TabsTrigger>
          <TabsTrigger value="overdue">Overdue ({overdueAccounts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <AccountsTable 
            accounts={filteredAccounts} 
            onEdit={handleEditAccount}
            onDelete={handleDeleteAccount}
          />
        </TabsContent>

        <TabsContent value="clients">
          <AccountsTable 
            accounts={clientAccounts} 
            onEdit={handleEditAccount}
            onDelete={handleDeleteAccount}
          />
        </TabsContent>

        <TabsContent value="vendors">
          <AccountsTable 
            accounts={vendorAccounts} 
            onEdit={handleEditAccount}
            onDelete={handleDeleteAccount}
          />
        </TabsContent>

        <TabsContent value="overdue">
          <OverdueAccountsTable accounts={overdueAccounts} />
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Account</DialogTitle>
          </DialogHeader>
          <AccountForm 
            formData={formData} 
            setFormData={setFormData} 
            onSubmit={handleUpdateAccount}
            submitLabel="Update Account"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AccountForm({ 
  formData, 
  setFormData, 
  onSubmit, 
  submitLabel 
}: { 
  formData: CreateAccountData; 
  setFormData: (data: CreateAccountData) => void; 
  onSubmit: () => void;
  submitLabel: string;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="account_name">Account Name</Label>
          <Input
            id="account_name"
            value={formData.account_name}
            onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
            placeholder="Enter account name"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="account_type">Account Type</Label>
          <Select
            value={formData.account_type}
            onValueChange={(value: 'client' | 'vendor' | 'internal') => 
              setFormData({ ...formData, account_type: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="client">Client</SelectItem>
              <SelectItem value="vendor">Vendor</SelectItem>
              <SelectItem value="internal">Internal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2 min-w-0">
          <Label htmlFor="client_name" className="text-sm sm:text-base">Client Name</Label>
          <Input
            id="client_name"
            value={formData.client_name || ''}
            onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
            placeholder="Enter client name"
            className="w-full"
          />
        </div>
        
        <div className="space-y-2 min-w-0">
          <Label htmlFor="client_email" className="text-sm sm:text-base">Client Email</Label>
          <Input
            id="client_email"
            type="email"
            value={formData.client_email || ''}
            onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
            placeholder="Enter client email"
            className="w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2 min-w-0">
          <Label htmlFor="payment_terms" className="text-sm sm:text-base">Payment Terms (days)</Label>
          <Input
            id="payment_terms"
            type="number"
            value={formData.payment_terms}
            onChange={(e) => setFormData({ ...formData, payment_terms: parseInt(e.target.value) })}
            className="w-full"
          />
        </div>
        
        <div className="space-y-2 min-w-0">
          <Label htmlFor="credit_limit" className="text-sm sm:text-base">Credit Limit</Label>
          <Input
            id="credit_limit"
            type="number"
            step="0.01"
            value={formData.credit_limit}
            onChange={(e) => setFormData({ ...formData, credit_limit: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes || ''}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Enter any additional notes"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline">Cancel</Button>
        <Button onClick={onSubmit}>{submitLabel}</Button>
      </div>
    </div>
  );
}

function AccountsTable({ 
  accounts, 
  onEdit, 
  onDelete 
}: { 
  accounts: Account[]; 
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
}) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account Number</TableHead>
              <TableHead>Account Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Outstanding Balance</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((account) => (
              <TableRow key={account.id}>
                <TableCell className="font-medium">{account.account_number}</TableCell>
                <TableCell>{account.account_name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{account.account_type}</Badge>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={account.status === 'active' ? 'default' : 'secondary'}
                  >
                    {account.status}
                  </Badge>
                </TableCell>
                <TableCell>${account.outstanding_balance.toLocaleString()}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(account)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(account)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function OverdueAccountsTable({ accounts }: { accounts: any[] }) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account Number</TableHead>
              <TableHead>Account Name</TableHead>
              <TableHead>Outstanding Balance</TableHead>
              <TableHead>Days Overdue</TableHead>
              <TableHead>Last Payment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((account) => (
              <TableRow key={account.account_id}>
                <TableCell className="font-medium">{account.account_number}</TableCell>
                <TableCell>{account.account_name}</TableCell>
                <TableCell>${account.outstanding_balance.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge variant="destructive">{account.days_overdue} days</Badge>
                </TableCell>
                <TableCell>
                  {account.last_payment_date 
                    ? new Date(account.last_payment_date).toLocaleDateString()
                    : 'Never'
                  }
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
