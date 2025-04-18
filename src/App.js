import LoginForm from "./Components/LoginForm/LoginForm";
import DashboardLayout from "./Components/Dashboard/DashboardLayout";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Profiles from "./Components/Dashboard/Admin/Profiles";
import { MenuProvider } from "./context/MenuContext";
import Security from "./Components/Dashboard/Admin/Security";
import Users from "./Components/Dashboard/Admin/Users";

function App() {
    return (
        <MenuProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<LoginForm />} />
                    <Route path="/dashboard" element={<DashboardLayout />}>
                        <Route path="admin/profiles" element={<Profiles />} />
                        <Route path="admin/security" element={<Security />} />
                        <Route path="admin/users" element={<Users />} />
                    </Route>
                </Routes>
            </Router>
        </MenuProvider>
    );
}

export default App;
