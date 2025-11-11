import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">404 - Not Found</h1>
        <p className="text-gray-600 dark:text-gray-300">
          The page you're looking for doesn't exist.
        </p>
        <Link to="/" className="text-brand-600 hover:underline">
          Go Home
        </Link>
      </div>
    </div>
  );
}
