import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SushiShop from "./components/SushiShop";
import Registration from "./pages/Registration";
import Menu from "./pages/Menu";
import AdminPanel from "./pages/AdminPanel";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import ProductsManagement from "./pages/ProductsManagement";
import CreateProduct from "./pages/CreateProduct";
import EditProduct from "./pages/EditProduct";
import ProductDetails from "./pages/ProductDetails";
import PublicProductDetails from "./pages/PublicProductDetails";
import CategoriesManagement from "./pages/CategoriesManagement";
import Checkout from "./pages/Checkout";
import OrdersManagement from "./pages/OrdersManagement";
import MyOrders from "./pages/MyOrders";
import OrdersStatistics from "./pages/OrdersStatistics";
import ProductPage from "./pages/ProductPage";
import Reviews from "./pages/Reviews";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SushiShop />} />
        <Route path="/registration" element={<Registration />} />
        <Route path="/login" element={<Login />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:userId" element={<UserProfile />} />
        <Route path="/products/manage" element={<ProductsManagement />} />
        <Route path="/products/create" element={<CreateProduct />} />
        <Route path="/products/edit/:productId" element={<EditProduct />} />
        <Route path="/products/:productId" element={<ProductDetails />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/categories" element={<CategoriesManagement />} />
        <Route path="/orders/manage" element={<OrdersManagement />} />
        <Route path="/my-orders" element={<MyOrders />} />
        <Route path="/orders/statistics" element={<OrdersStatistics />} />
        <Route path="/reviews" element={<Reviews />} />
      </Routes>
    </Router>
  );
}
