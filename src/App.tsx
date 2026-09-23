import type { ReactNode } from "react";
import { Route, Routes } from "react-router-dom";
import { FavoritesProvider } from "@/lib/favorites";
import { ShopProvider } from "@/lib/shop";
import { AuthProvider } from "@/lib/auth";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ArtistDashboardLayout } from "@/components/dashboard/ArtistDashboardLayout";
import {
  HomePage,
  DiscoverPage,
  ArtworkDetailPage,
  ArtistProfilePage,
  NotFoundPage,
  SignInPage,
  SignUpPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  ProfilePage,
  CartPage,
  WishlistPage,
  CheckoutPage,
  OrdersPage,
  OrderDetailPage,
  DashboardRedirect,
  BuyerDashboardPage,
} from "@/pages";
import { PageTitle } from "@/hooks/usePageTitle";
import { AdminOverviewPage } from "@/pages/admin/OverviewPage";
import { AdminUsersPage } from "@/pages/admin/UsersPage";
import { AdminArtistsPage } from "@/pages/admin/ArtistsPage";
import { AdminArtworkPage } from "@/pages/admin/ArtworkPage";
import { AdminOrdersPage } from "@/pages/admin/OrdersPage";
import { AdminCategoriesPage } from "@/pages/admin/CategoriesPage";
import { AdminReportsPage } from "@/pages/admin/ReportsPage";
import { AdminSettingsPage } from "@/pages/admin/SettingsPage";
import { ArtistOverviewPage } from "@/pages/artist/OverviewPage";
import { ArtistMyArtworkPage } from "@/pages/artist/MyArtworkPage";
import { ArtworkFormPage } from "@/pages/artist/ArtworkFormPage";
import {
  ArtistOrdersPage,
} from "@/pages/artist/OrdersPage";
import {
  ArtistEarningsPage,
} from "@/pages/artist/EarningsPage";
import {
  ArtistProfileSettingsPage,
  ArtistSettingsPage,
} from "@/pages/artist/PlaceholderPages";

/** Route-level tab title — keeps document.title colocated with routing. */
function titled(title: string, node: ReactNode) {
  return (
    <>
      <PageTitle title={title} />
      {node}
    </>
  );
}

/**
 * Route tree. Public browsing stays open; dashboards are wrapped in
 * RequireAuth (role-scoped). The artist dashboard is a nested layout with
 * its own sidebar. Later stages add checkout and admin management behind
 * the same guards.
 */
export default function App() {
  return (
    <AuthProvider>
      <FavoritesProvider>
        <ShopProvider>
          <Routes>
            <Route element={<SiteLayout />}>
              {/* Public */}
              <Route index element={<HomePage />} />
              <Route path="discover" element={titled("Discover Artwork", <DiscoverPage />)} />
              <Route path="artwork/:id" element={<ArtworkDetailPage />} />
              <Route path="artist/:id" element={<ArtistProfilePage />} />
              <Route path="sign-in" element={titled("Sign In", <SignInPage />)} />
              <Route path="sign-up" element={titled("Create Account", <SignUpPage />)} />
              <Route path="forgot-password" element={titled("Reset Password", <ForgotPasswordPage />)} />
              <Route path="reset-password" element={titled("Choose a New Password", <ResetPasswordPage />)} />

              {/* Buyer shopping (Stage 7) — open to guests; carts persist per account */}
              <Route path="cart" element={titled("Shopping Cart", <CartPage />)} />
              <Route path="wishlist" element={titled("Wishlist", <WishlistPage />)} />

              {/* Orders (Stage 8) — checkout is open to guests, order views require an account */}
              <Route path="checkout" element={titled("Checkout", <CheckoutPage />)} />
              <Route
                path="orders"
                element={
                  <RequireAuth>{titled("My Orders", <OrdersPage />)}</RequireAuth>
                }
              />
              <Route
                path="orders/:id"
                element={
                  <RequireAuth>
                    <OrderDetailPage />
                  </RequireAuth>
                }
              />

              {/* Authenticated (any role) */}
              <Route
                path="dashboard"
                element={
                  <RequireAuth>
                    <DashboardRedirect />
                  </RequireAuth>
                }
              />
              <Route
                path="profile"
                element={
                  <RequireAuth>{titled("Profile", <ProfilePage />)}</RequireAuth>
                }
              />

              {/* Buyer dashboard */}
              <Route
                path="dashboard/buyer"
                element={
                  <RequireAuth role="buyer">
                    {titled("Buyer Dashboard", <BuyerDashboardPage />)}
                  </RequireAuth>
                }
              />

              {/* Artist dashboard (nested layout with sidebar) */}
              <Route
                path="dashboard/artist"
                element={
                  <RequireAuth role="artist">
                    {titled("Artist Studio", <ArtistDashboardLayout />)}
                  </RequireAuth>
                }
              >
                <Route index element={<ArtistOverviewPage />} />
                <Route path="artwork" element={<ArtistMyArtworkPage />} />
                <Route path="add" element={<ArtworkFormPage mode="add" />} />
                <Route
                  path="edit/:id"
                  element={<ArtworkFormPage mode="edit" />}
                />
                <Route path="orders" element={<ArtistOrdersPage />} />
                <Route path="earnings" element={<ArtistEarningsPage />} />
                <Route
                  path="profile"
                  element={<ArtistProfileSettingsPage />}
                />
                <Route path="settings" element={<ArtistSettingsPage />} />
              </Route>

              <Route path="*" element={titled("Page Not Found", <NotFoundPage />)} />
            </Route>

            {/* Admin application — separate chrome, admin-only (Stage 9) */}
            <Route
              path="admin"
              element={
                <RequireAuth role="admin">
                  {titled("Admin", <AdminLayout />)}
                </RequireAuth>
              }
            >
              <Route index element={<AdminOverviewPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="artists" element={<AdminArtistsPage />} />
              <Route path="artwork" element={<AdminArtworkPage />} />
              <Route path="orders" element={<AdminOrdersPage />} />
              <Route path="categories" element={<AdminCategoriesPage />} />
              <Route path="reports" element={<AdminReportsPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>
          </Routes>
        </ShopProvider>
      </FavoritesProvider>
    </AuthProvider>
  );
}
