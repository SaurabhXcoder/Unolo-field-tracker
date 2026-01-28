import { useState, useEffect } from "react";
import api from "../utils/api";

function Dashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]); // 🔥 CRITICAL FIX

  const fetchDashboardData = async () => {
    try {
      const endpoint =
        user.role === "manager"
          ? "/dashboard/stats"
          : "/dashboard/employee";

      const response = await api.get(endpoint);

      if (response.data.success) {
        setStats(response.data.data);
      } else {
        setError("Failed to load dashboard");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  /* ================= MANAGER DASHBOARD ================= */
  if (user.role === "manager") {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-6">Manager Dashboard</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm">Team Size</h3>
            <p className="text-3xl font-bold text-blue-600">
              {stats?.team_size || 0}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm">Active Check-ins</h3>
            <p className="text-3xl font-bold text-green-600">
              {stats?.active_checkins || 0}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm">Today's Visits</h3>
            <p className="text-3xl font-bold text-purple-600">
              {stats?.today_checkins?.length || 0}
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ================= EMPLOYEE DASHBOARD ================= */
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">My Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Assigned Clients</h3>
          <p className="text-3xl font-bold text-blue-600">
            {stats?.assigned_clients?.length || 0}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">This Week's Visits</h3>
          <p className="text-3xl font-bold text-green-600">
            {stats?.week_stats?.total_checkins || 0}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Today's Check-ins</h3>
          <p className="text-3xl font-bold text-purple-600">
            {stats?.today_checkins?.length || 0}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
