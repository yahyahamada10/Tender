import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import AuthPage from "@/pages/auth-page";
import Tenders from "@/pages/tenders";
import Contracts from "@/pages/contracts";
import ServiceOrders from "@/pages/service-orders";
import Users from "@/pages/users";
import Departments from "@/pages/departments";
import TenderDetails from "@/pages/tender-details";
import CreateTender from "@/pages/create-tender";
import Analytics from "@/pages/analytics";
import Reports from "@/pages/reports";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/tenders" component={Tenders} />
      <ProtectedRoute path="/tenders/new" component={CreateTender} />
      <ProtectedRoute path="/tenders/:id" component={TenderDetails} />
      <ProtectedRoute path="/contracts" component={Contracts} />
      <ProtectedRoute path="/service-orders" component={ServiceOrders} />
      <ProtectedRoute path="/users" component={Users} />
      <ProtectedRoute path="/departments" component={Departments} />
      <ProtectedRoute path="/analytics" component={Analytics} />
      <ProtectedRoute path="/reports" component={Reports} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router />
      <Toaster />
    </AuthProvider>
  );
}

export default App;
