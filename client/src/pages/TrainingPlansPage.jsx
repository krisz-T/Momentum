import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaClipboardList, FaEye } from 'react-icons/fa';

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
      <div className="page-header">
        <h1><FaClipboardList /> Training Plans</h1>
        <nav>
          <Link to="/" className="icon-link"><FaArrowLeft /> <span>Back to Home</span></Link>
        </nav>
      </div>
      <p className="page-description">Browse our available plans to kickstart your fitness journey.</p>
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
            <Link to={`/plans/${plan.id}`} className="button-link icon-link">
              <FaEye />
              <span>View Plan</span>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrainingPlansPage;