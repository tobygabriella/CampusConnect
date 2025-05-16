import { Link } from "react-router-dom";

const NotAuthorized = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold mb-4">403 - Not Authorized</h1>
      <p className="text-lg mb-6">
        You do not have permission to access this page.
      </p>
      <Link
        to="/profile"
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        Return to Your Profile
      </Link>
    </div>
  );
};

export default NotAuthorized;