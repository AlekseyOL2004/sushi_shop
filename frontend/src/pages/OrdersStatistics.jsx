import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import "./OrdersStatistics.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

const STATUS_CONFIG = {
  pending: { label: "Очікує підтвердження", color: "#fbbf24", icon: "⏳" },
  processing: { label: "В обробці", color: "#f97316", icon: "⏳" },
  confirmed: { label: "Підтверджено", color: "#4299e1", icon: "✓" },
  preparing: { label: "Готується", color: "#f97316", icon: "👨‍🍳" },
  ready: { label: "Готово", color: "#48bb78", icon: "✓✓" },
  delivering: { label: "Доставляється", color: "#ed8936", icon: "🚗" },
  completed: { label: "Виконано", color: "#38a169", icon: "✓✓✓" },
  cancelled: { label: "Скасовано", color: "#e53e3e", icon: "✗" },
};

export default function OrdersStatistics() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [dateFilter, setDateFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      navigate("/login");
      return;
    }
    const user = JSON.parse(userData);
    if (user.role !== "admin" && user.role !== "moderator") {
      navigate("/");
      return;
    }
    setCurrentUser(user);
    fetchOrders();
  }, [navigate]);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_BASE}/orders`);
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrdersByDate = () => {
    const now = new Date();
    return orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      switch (dateFilter) {
        case "today":
          return orderDate.toDateString() === now.toDateString();
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return orderDate >= weekAgo;
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return orderDate >= monthAgo;
        default:
          return true;
      }
    });
  };

  const getStatistics = () => {
    const filtered = filterOrdersByDate();
    const totalOrders = filtered.length;
    const totalRevenue = filtered.reduce(
      (sum, order) => sum + order.totalPrice,
      0
    );
    const completedOrders = filtered.filter(
      (o) => o.status === "completed"
    ).length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const productCount = {};
    filtered.forEach((order) => {
      order.items.forEach((item) => {
        if (!productCount[item.name]) {
          productCount[item.name] = { quantity: 0, revenue: 0 };
        }
        productCount[item.name].quantity += item.quantity;
        productCount[item.name].revenue += item.price * item.quantity;
      });
    });

    const topProducts = Object.entries(productCount)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return {
      totalOrders,
      totalRevenue,
      completedOrders,
      averageOrderValue,
      topProducts,
    };
  };

  const getChartData = () => {
    const filtered = filterOrdersByDate();

    if (dateFilter === "today") {
      const hourly = Array(24).fill(0);
      filtered.forEach((order) => {
        const hour = new Date(order.createdAt).getHours();
        hourly[hour]++;
      });
      return hourly.slice(0, new Date().getHours() + 1).map((count, hour) => ({
        label: `${hour}:00`,
        count,
      }));
    } else if (dateFilter === "week") {
      const daily = Array(7).fill(0);
      const days = ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
      filtered.forEach((order) => {
        const dayOfWeek = new Date(order.createdAt).getDay();
        daily[dayOfWeek]++;
      });
      return daily.map((count, index) => ({
        label: days[index],
        count,
      }));
    } else if (dateFilter === "month") {
      const daily = Array(30).fill(0);
      filtered.forEach((order) => {
        const daysAgo = Math.floor(
          (Date.now() - new Date(order.createdAt).getTime()) /
            (24 * 60 * 60 * 1000)
        );
        if (daysAgo < 30) daily[29 - daysAgo]++;
      });
      return daily
        .map((count, index) => ({
          label: `${index + 1}`,
          count,
        }))
        .filter((_, i) => i % 3 === 0);
    } else {
      const monthly = {};
      filtered.forEach((order) => {
        const month = new Date(order.createdAt).toLocaleDateString("uk-UA", {
          month: "short",
        });
        monthly[month] = (monthly[month] || 0) + 1;
      });
      return Object.entries(monthly).map(([label, count]) => ({
        label,
        count,
      }));
    }
  };

  const renderLineChart = () => {
    const data = getChartData();
    if (data.length === 0) {
      return <div className="no-data">Немає даних для відображення</div>;
    }

    const maxValue = Math.max(...data.map((d) => d.count), 1);
    const chartHeight = 250;

    // Якщо тільки одна точка даних, показуємо спрощений графік
    if (data.length === 1) {
      return (
        <div className="line-chart-container">
          <div className="chart-area">
            <div className="chart-grid-lines">
              {[0, 25, 50, 75, 100].map((percent) => (
                <div
                  key={percent}
                  className="grid-line"
                  style={{ bottom: `${percent}%` }}
                >
                  <span className="grid-value">
                    {Math.round((maxValue * percent) / 100)}
                  </span>
                </div>
              ))}
            </div>

            <div className="chart-content">
              <svg
                className="chart-svg"
                viewBox="0 0 1000 250"
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  <linearGradient
                    id="lineGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop offset="0%" stopColor="#1c879e" />
                    <stop offset="100%" stopColor="#00c2a5" />
                  </linearGradient>
                </defs>

                <circle
                  cx={500}
                  cy={chartHeight - (data[0].count / maxValue) * chartHeight}
                  r="8"
                  fill="white"
                  stroke="#1c879e"
                  strokeWidth="3"
                />
                <circle
                  cx={500}
                  cy={chartHeight - (data[0].count / maxValue) * chartHeight}
                  r="5"
                  fill="#1c879e"
                />
              </svg>
            </div>
          </div>

          <div className="chart-labels">
            <div className="chart-label-item">
              <div className="label-value">{data[0].count}</div>
              <div className="label-text">{data[0].label}</div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="line-chart-container">
        <div className="chart-area">
          {/* Grid lines */}
          <div className="chart-grid-lines">
            {[0, 25, 50, 75, 100].map((percent) => (
              <div
                key={percent}
                className="grid-line"
                style={{ bottom: `${percent}%` }}
              >
                <span className="grid-value">
                  {Math.round((maxValue * percent) / 100)}
                </span>
              </div>
            ))}
          </div>

          {/* Chart content */}
          <div className="chart-content">
            <svg
              className="chart-svg"
              viewBox="0 0 1000 250"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <linearGradient
                  id="lineGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#1c879e" />
                  <stop offset="100%" stopColor="#00c2a5" />
                </linearGradient>
                <linearGradient
                  id="areaGradient"
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#1c879e" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#00c2a5" stopOpacity="0.05" />
                </linearGradient>
              </defs>

              {/* Area under line */}
              <path
                d={`
                  M 0,${chartHeight}
                  ${data
                    .map((item, index) => {
                      const x = ((index / Math.max(data.length - 1, 1)) * 1000) || 0;
                      const y = chartHeight - ((item.count / maxValue) * chartHeight) || chartHeight;
                      return `L ${x},${y}`;
                    })
                    .join(" ")}
                  L 1000,${chartHeight}
                  Z
                `}
                fill="url(#areaGradient)"
              />

              {/* Main line */}
              <path
                d={data
                  .map((item, index) => {
                    const x = ((index / Math.max(data.length - 1, 1)) * 1000) || 0;
                    const y = chartHeight - ((item.count / maxValue) * chartHeight) || chartHeight;
                    return `${index === 0 ? "M" : "L"} ${x},${y}`;
                  })
                  .join(" ")}
                fill="none"
                stroke="url(#lineGradient)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points */}
              {data.map((item, index) => {
                const x = ((index / Math.max(data.length - 1, 1)) * 1000) || 0;
                const y = chartHeight - ((item.count / maxValue) * chartHeight) || chartHeight;
                
                // Перевірка на валідність координат
                if (isNaN(x) || isNaN(y)) return null;
                
                return (
                  <g key={index}>
                    <circle
                      cx={x}
                      cy={y}
                      r="5"
                      fill="white"
                      stroke="#1c879e"
                      strokeWidth="3"
                      className="data-point"
                    />
                    <circle cx={x} cy={y} r="3" fill="#1c879e" />
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Labels */}
        <div className="chart-labels">
          {data.map((item, index) => (
            <div key={index} className="chart-label-item">
              <div className="label-value">{item.count}</div>
              <div className="label-text">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderStatusChart = () => {
    const filtered = filterOrdersByDate();
    const statusCounts = {};
    filtered.forEach((order) => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });

    const total = filtered.length || 1;

    return (
      <div className="status-chart">
        {Object.entries(STATUS_CONFIG).map(([status, config]) => {
          const count = statusCounts[status] || 0;
          const percentage = (count / total) * 100;

          return (
            <div key={status} className="status-bar-item">
              <div className="status-label">
                <span>{config.label}</span>
                <span className="status-count">{count}</span>
              </div>
              <div className="status-bar-bg">
                <div
                  className="status-bar-fill"
                  style={{
                    width: `${percentage}%`,
                    background: config.color,
                  }}
                >
                  {percentage > 10 && `${percentage.toFixed(0)}%`}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDeliveryChart = () => {
    const filtered = filterOrdersByDate();
    const deliveryCounts = {
      delivery: 0,
      pickup: 0,
    };

    filtered.forEach((order) => {
      deliveryCounts[order.deliveryType] =
        (deliveryCounts[order.deliveryType] || 0) + 1;
    });

    const total = filtered.length || 1;
    const deliveryPercentage = (deliveryCounts.delivery / total) * 100;
    const pickupPercentage = (deliveryCounts.pickup / total) * 100;

    return (
      <div className="delivery-chart">
        <div className="delivery-item">
          <div
            className="delivery-circle"
            style={{
              background: `conic-gradient(
                #1c879e 0deg ${deliveryPercentage * 3.6}deg,
                #00c2a5 ${deliveryPercentage * 3.6}deg 360deg
              )`,
            }}
          >
            <div className="delivery-circle-inner">
              <strong>{total}</strong>
              <span>замовлень</span>
            </div>
          </div>
          <div className="delivery-legend">
            <div className="legend-item">
              <div
                className="legend-color"
                style={{ background: "#1c879e" }}
              ></div>
              <span>
                Доставка: {deliveryCounts.delivery} (
                {deliveryPercentage.toFixed(0)}%)
              </span>
            </div>
            <div className="legend-item">
              <div
                className="legend-color"
                style={{ background: "#00c2a5" }}
              ></div>
              <span>
                Самовивіз: {deliveryCounts.pickup} (
                {pickupPercentage.toFixed(0)}%)
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="loading">Завантаження...</div>;
  }

  const stats = getStatistics();

  return (
    <div className="statistics-page">
      <Header />

      <div className="statistics-container">
        <h1>Статистика замовлень</h1>

        <div className="date-filters">
          <button
            className={`filter-btn ${dateFilter === "all" ? "active" : ""}`}
            onClick={() => setDateFilter("all")}
          >
            Весь час
          </button>
          <button
            className={`filter-btn ${dateFilter === "today" ? "active" : ""}`}
            onClick={() => setDateFilter("today")}
          >
            Сьогодні
          </button>
          <button
            className={`filter-btn ${dateFilter === "week" ? "active" : ""}`}
            onClick={() => setDateFilter("week")}
          >
            Тиждень
          </button>
          <button
            className={`filter-btn ${dateFilter === "month" ? "active" : ""}`}
            onClick={() => setDateFilter("month")}
          >
            Місяць
          </button>
        </div>

        <div className="stats-grid">
          <div className="stat-card-big">
            <div className="stat-icon">
              <img src="/icon/box.png" alt="Замовлення" />
            </div>
            <h3>Всього замовлень</h3>
            <p className="stat-value">{stats.totalOrders}</p>
          </div>

          <div className="stat-card-big">
            <div className="stat-icon">
              <img src="/icon/total-income.png" alt="Дохід" />
            </div>
            <h3>Загальний дохід</h3>
            <p className="stat-value">{stats.totalRevenue.toFixed(2)}₴</p>
          </div>

          <div className="stat-card-big">
            <div className="stat-icon">
              <img src="/icon/average-check.png" alt="Середній чек" />
            </div>
            <h3>Середній чек</h3>
            <p className="stat-value">{stats.averageOrderValue.toFixed(2)}₴</p>
          </div>

          <div className="stat-card-big">
            <div className="stat-icon">
              <img src="/icon/done.png" alt="Виконано" />
            </div>
            <h3>Виконано</h3>
            <p className="stat-value">{stats.completedOrders}</p>
          </div>
        </div>

        <div className="charts-grid-full">
          <div className="chart-card">
            <h3>Динаміка замовлень</h3>
            <div className="line-chart">{renderLineChart()}</div>
          </div>
        </div>

        <div className="charts-grid">
          <div className="chart-card">
            <h3>Статуси замовлень</h3>
            {renderStatusChart()}
          </div>

          <div className="chart-card">
            <h3>Тип доставки</h3>
            {renderDeliveryChart()}
          </div>
        </div>

        <div className="top-products-card">
          <h3>Топ-5 популярних товарів</h3>
          <div className="products-table">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Назва товару</th>
                  <th>Кількість</th>
                  <th>Дохід</th>
                </tr>
              </thead>
              <tbody>
                {stats.topProducts.map((product, index) => (
                  <tr key={index}>
                    <td className="rank">{index + 1}</td>
                    <td className="product-name">{product.name}</td>
                    <td>{product.quantity}</td>
                    <td className="revenue">{product.revenue.toFixed(2)}₴</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
