import { useAppSelector, useAppDispatch } from "../store/hooks";
import { logout } from "../store/authSlice";
import { ThemeToggle } from "./ThemeToggle";

export function Topbar() {
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();

  return (
    <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur dark:bg-gray-900/80">
      <div className="container-page flex items-center justify-between py-3">
        <div className="font-semibold">Role App</div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {user && (
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">{user.name}</span>
              <span className="text-gray-500">({user.role})</span>
              <button
                onClick={() => dispatch(logout())}
                className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
