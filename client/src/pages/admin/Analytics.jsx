import React, { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper,
  Card,
  CardContent,
  CardHeader,
  Divider
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#0088FE', '#FF8042', '#82ca9d', '#ffc658', '#ff7300', '#00C49F'];

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboard, setDashboard] = useState(null);
  const [stats, setStats] = useState(null);
  const [interests, setInterests] = useState([]);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.admin.getDashboard();
      setDashboard(data);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load analytics dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      setError('');
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const data = await api.admin.getStatistics(params);
      setStats(data);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load statistics');
    }
  };

  const loadInterests = async () => {
    try {
      setError('');
      const params = {};
      // If date filters set, apply to interests too (server may ignore unknown params; safe)
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await api.interests.getAll(params);
      // API returns { success, data } for interests admin list
      const items = Array.isArray(res?.data) ? res.data : (res?.interests || []);
      setInterests(items);
    } catch (e) {
      // Non-fatal; keep other analytics visible
      console.warn('Failed to load interests for analytics', e?.response?.data || e.message);
    }
  };

  useEffect(() => {
    loadDashboard();
    loadStatistics();
    loadInterests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestsByTypeBar = useMemo(() => {
    const src = stats?.requestsByType || dashboard?.requestsByType || [];
    return src.map((x) => ({ name: x._id || 'Unknown', count: x.count }));
  }, [stats, dashboard]);

  const usersByTypePie = useMemo(() => {
    const src = stats?.usersByType || dashboard?.usersByType || [];
    return src
      .map((x) => ({ name: x._id || 'Unknown', value: x.count }))
      .sort((a) => (a.name.toLowerCase() === 'test lessee' ? 1 : -1));
  }, [stats, dashboard]);

  // Interests aggregations (client-side)
  const interestCounts = useMemo(() => {
    const total = interests.length;
    const byStatus = interests.reduce((acc, it) => {
      acc[it.status || 'unknown'] = (acc[it.status || 'unknown'] || 0) + 1;
      return acc;
    }, {});
    const byType = interests.reduce((acc, it) => {
      acc[it.type || 'other'] = (acc[it.type || 'other'] || 0) + 1;
      return acc;
    }, {});
    return { total, byStatus, byType };
  }, [interests]);

  const interestsByTypeBar = useMemo(() => {
    const entries = Object.entries(interestCounts.byType || {});
    return entries.map(([name, count]) => ({ name, count }));
  }, [interestCounts]);

  const interestsByStatusPie = useMemo(() => {
    const entries = Object.entries(interestCounts.byStatus || {});
    return entries.map(([name, value]) => ({ name, value }));
  }, [interestCounts]);

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Analytics Dashboard
      </Typography>
      {error && (
        <Box sx={{ mb: 2, color: 'error.main' }}>{error}</Box>
      )}

      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Consolidated Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Users</Typography>
              <Typography variant="h4">{dashboard?.statistics?.totalUsers ?? (loading ? '…' : 0)}</Typography>
              <Typography variant="caption" color="text.secondary">All registered users</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Interests</Typography>
              <Typography variant="h4">{interestCounts.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Pending Interests</Typography>
              <Typography variant="h4">{interestCounts.byStatus?.pending || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>In Progress Interests</Typography>
              <Typography variant="h4">{interestCounts.byStatus?.in_progress || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Interests by Type (Bar) */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Interests by Type</Typography>
            <div style={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={interestsByTypeBar}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#00C49F" name="Interests" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Paper>
        </Grid>

        {/* Users by Type (Pie) */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Interests by Status</Typography>
            <div style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={interestsByStatusPie}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {interestsByStatusPie.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Paper>
        </Grid>

        {/* Users by Type (Pie) */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Users by Type</Typography>
            <div style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={usersByTypePie}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={120}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {usersByTypePie.map((entry, index) => (
                      <Cell key={`cell-user-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Paper>
        </Grid>

        {/* Recent Interests */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Recent Interests</Typography>
            <Box sx={{ maxHeight: 320, overflow: 'auto' }}>
              {interests.slice(0, 10).map((it) => (
                <Box key={it._id} sx={{ p: 1, borderBottom: '1px solid #eee' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography>
                      {it?.user?.firstName} {it?.user?.lastName} — <strong>{it?.status}</strong> — {it?.type}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {new Date(it.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                  {it?.notes && (
                    <Typography variant="body2" color="textSecondary">{it.notes.slice(0, 140)}</Typography>
                  )}
                </Box>
              ))}
              {interests.length === 0 && (
                <Typography variant="body2" color="textSecondary">No interests found</Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Analytics;
