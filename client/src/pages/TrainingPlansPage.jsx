import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const TrainingPlansPage = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/plans`);
        if (!response.ok) throw new Error('Failed to fetch training plans');
        const data = await response.json();
        setPlans(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  return (
    <div>
      <h1>Training Plans</h1>
      <p>Browse our available plans to kickstart your fitness journey.</p>
      <nav>
        <Link to="/">Back to Home</Link>
      </nav>

      {loading && <p>Loading plans...</p>}
      {error && <p style={{ color: '#ff6b6b' }}>Error: {error}</p>}

      <div className="plans-list">
        {plans.map(plan => (
          <div key={plan.id} className="plan-card">
            <h2>{plan.title}</h2>
            <p>{plan.description}</p>
            <span>
              {plan.duration_weeks ? `${plan.duration_weeks} weeks` : 'Ongoing'}
            </span>
            <Link to={`/plans/${plan.id}`} className="button-link">
              View Plan
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrainingPlansPage;