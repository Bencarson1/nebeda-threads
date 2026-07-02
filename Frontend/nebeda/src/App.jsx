import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import SiteMetadata from './components/common/SiteMetadata'
import Footer from './components/layout/Footer'
import Navbar from './components/layout/Navbar'
import FloatingScrollButton from './components/ui/FloatingScrollButton'
import { ToastProvider } from './components/ui/Toast'
import { CartProvider } from './context/CartContext'
import { isAdminAuthenticated } from './services/authService'

const About = lazy(() => import('./pages/About'))
const AddProduct = lazy(() => import('./pages/admin/AddProduct'))
const AdminCustomOrders = lazy(() => import('./pages/admin/AdminCustomOrders'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminEmailLogs = lazy(() => import('./pages/admin/AdminEmailLogs'))
const AdminEnquiries = lazy(() => import('./pages/admin/AdminEnquiries'))
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'))
const AdminNewsletter = lazy(() => import('./pages/admin/AdminNewsletter'))
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'))
const AdminPayments = lazy(() => import('./pages/admin/AdminPayments'))
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'))
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'))
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'))
const EditProduct = lazy(() => import('./pages/admin/EditProduct'))
const AccountDashboard = lazy(() => import('./pages/account/AccountDashboard'))
const CustomOrderDetails = lazy(() => import('./pages/account/CustomOrderDetails'))
const MyCustomOrders = lazy(() => import('./pages/account/MyCustomOrders'))
const MyOrders = lazy(() => import('./pages/account/MyOrders'))
const OrderDetails = lazy(() => import('./pages/account/OrderDetails'))
const Profile = lazy(() => import('./pages/account/Profile'))
const Security = lazy(() => import('./pages/account/Security'))
const Cart = lazy(() => import('./pages/Cart'))
const Checkout = lazy(() => import('./pages/Checkout'))
const Contact = lazy(() => import('./pages/Contact'))
const CustomOrder = lazy(() => import('./pages/CustomOrder'))
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'))
const Home = lazy(() => import('./pages/Home'))
const Login = lazy(() => import('./pages/auth/Login'))
const NotFound = lazy(() => import('./pages/NotFound'))
const PaymentCancel = lazy(() => import('./pages/payment/PaymentCancel'))
const PaymentSuccess = lazy(() => import('./pages/payment/PaymentSuccess'))
const PrivacyPolicy = lazy(() => import('./pages/legal/PrivacyPolicy'))
const ProductDetails = lazy(() => import('./pages/ProductDetails'))
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'))
const ShippingInformation = lazy(() => import('./pages/ShippingInformation'))
const ShippingReturns = lazy(() => import('./pages/legal/ShippingReturns'))
const Shop = lazy(() => import('./pages/Shop'))
const Signup = lazy(() => import('./pages/auth/Signup'))
const Terms = lazy(() => import('./pages/legal/Terms'))
const VerifyEmail = lazy(() => import('./pages/auth/VerifyEmail'))

function ProtectedAdminRoute({ children }) {
  return isAdminAuthenticated() ? children : <Navigate replace to="/admin/login" />
}

function App() {
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')

  return (
    <ToastProvider>
      <CartProvider>
        <SiteMetadata />
        <div className="min-h-screen bg-black">
          {isAdminRoute ? null : <Navbar />}
          {isAdminRoute ? null : <FloatingScrollButton />}
          <main>
            <Suspense fallback={<div aria-label="Loading page" className="min-h-[60vh] bg-black" role="status" />}>
              <Routes>
              <Route element={<Home />} path="/" />
              <Route element={<Shop />} path="/shop" />
              <Route element={<ProductDetails />} path="/shop/:slug" />
              <Route element={<Cart />} path="/cart" />
              <Route element={<Checkout />} path="/checkout" />
              <Route element={<PaymentSuccess />} path="/payment/success" />
              <Route element={<PaymentCancel />} path="/payment/cancel" />
              <Route element={<Login />} path="/login" />
              <Route element={<Signup />} path="/signup" />
              <Route element={<ForgotPassword />} path="/forgot-password" />
              <Route element={<ResetPassword />} path="/reset-password/:token" />
              <Route element={<VerifyEmail />} path="/verify-email" />
              <Route element={<AccountDashboard />} path="/account" />
              <Route element={<MyOrders />} path="/account/orders" />
              <Route element={<OrderDetails />} path="/account/orders/:id" />
              <Route element={<MyCustomOrders />} path="/account/custom-orders" />
              <Route element={<CustomOrderDetails />} path="/account/custom-orders/:id" />
              <Route element={<Profile />} path="/account/profile" />
              <Route element={<Security />} path="/account/security" />
              <Route element={<CustomOrder />} path="/custom-order" />
              <Route element={<About />} path="/about" />
              <Route element={<Contact />} path="/contact" />
              <Route element={<PrivacyPolicy />} path="/privacy-policy" />
              <Route element={<ShippingInformation />} path="/shipping-information" />
              <Route element={<Terms />} path="/terms" />
              <Route element={<ShippingReturns />} path="/shipping-returns" />
              <Route element={<AdminLogin />} path="/admin/login" />
              <Route
                element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>}
                path="/admin/dashboard"
              />
              <Route
                element={<ProtectedAdminRoute><AdminProducts /></ProtectedAdminRoute>}
                path="/admin/products"
              />
              <Route
                element={<ProtectedAdminRoute><AddProduct /></ProtectedAdminRoute>}
                path="/admin/products/add"
              />
              <Route
                element={<ProtectedAdminRoute><EditProduct /></ProtectedAdminRoute>}
                path="/admin/products/edit/:id"
              />
              <Route
                element={<ProtectedAdminRoute><AdminOrders /></ProtectedAdminRoute>}
                path="/admin/orders"
              />
              <Route
                element={<ProtectedAdminRoute><AdminCustomOrders /></ProtectedAdminRoute>}
                path="/admin/custom-orders"
              />
              <Route
                element={<ProtectedAdminRoute><AdminEnquiries /></ProtectedAdminRoute>}
                path="/admin/enquiries"
              />
              <Route
                element={<ProtectedAdminRoute><AdminUsers /></ProtectedAdminRoute>}
                path="/admin/users"
              />
              <Route
                element={<ProtectedAdminRoute><AdminNewsletter /></ProtectedAdminRoute>}
                path="/admin/newsletter"
              />
              <Route
                element={<ProtectedAdminRoute><AdminPayments /></ProtectedAdminRoute>}
                path="/admin/payments"
              />
              <Route
                element={<ProtectedAdminRoute><AdminSettings /></ProtectedAdminRoute>}
                path="/admin/settings"
              />
              <Route
                element={<ProtectedAdminRoute><AdminEmailLogs /></ProtectedAdminRoute>}
                path="/admin/email-logs"
              />
              <Route element={<Navigate replace to="/admin/dashboard" />} path="/admin" />
              <Route element={<NotFound />} path="*" />
              </Routes>
            </Suspense>
          </main>
          {isAdminRoute ? null : <Footer />}
        </div>
      </CartProvider>
    </ToastProvider>
  )
}

export default App
