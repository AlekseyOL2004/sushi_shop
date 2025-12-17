import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SushiShop from "./components/SushiShop";
import Registration from "./pages/Registration";
import Menu from "./pages/Menu";
import AdminPanel from "./pages/AdminPanel";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SushiShop />} />
        <Route path="/registration" element={<Registration />} />
        <Route path="/login" element={<Login />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:userId" element={<UserProfile />} />
      </Routes>
    </Router>
  );
}
