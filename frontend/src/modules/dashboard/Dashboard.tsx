
import {
  Activity,
  Bot,
  Clock3,
  Workflow,
  Plus,
  ArrowUpRight,
  MoreHorizontal,
  Play,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader'
import StatCard from '../../components/common/StatCard'

const jobs = [
  {
    name: 'Invoice Processing',
    robot: 'Robot-Production-01',
    status: 'Completed',
    time: '2 minutes ago',
    duration: '00:02:14',
  },
  {
    name: 'Customer Data Sync',
    robot: 'Robot-Production-02',
    status: 'Running',
    time: '5 minutes ago',
    duration: '00:01:42',
  },
  {
    name: 'Email Classification',
    robot: 'Robot-Development-01',
    status: 'Completed',
    time: '12 minutes ago',
    duration: '00:00:58',
  },
  {
    name: 'Monthly Report',
    robot: 'Robot-Production-01',
    status: 'Failed',
    time: '25 minutes ago',
    duration: '00:00:32',
  },
]

export default function Dashboard() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="WORKSPACE OVERVIEW"
        title="Good evening, Administrator"
        description="Monitor your automation operations and manage enterprise workflows."
        action={
          <Link className="primary-button" to="/designer">
            <Plus size={17} /> Create Automation
          </Link>
        }
      />

      <div className="welcome-banner">
        <div>
          <span className="banner-label">APEXIVEAI AUTOMATION CLOUD</span>
          <h2>Automate more. Operate smarter.</h2>
          <p>
            Your automation workspace is ready. Build, deploy,
            and monitor intelligent business processes.
          </p>
          <Link to="/designer" className="banner-button">
            Open Process Designer <ArrowUpRight size={16} />
          </Link>
        </div>

        <div className="banner-art">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="orbit-core">
            <Workflow size={44} />
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          label="Total Automations"
          value="128"
          change="+12.8% this month"
          icon={Workflow}
        />
        <StatCard
          label="Active Robots"
          value="24"
          change="18 online · 6 idle"
          icon={Bot}
        />
        <StatCard
          label="Jobs Executed"
          value="8,492"
          change="+18.2% this month"
          icon={Activity}
        />
        <StatCard
          label="Time Saved"
          value="1,284h"
          change="+8.4% this month"
          icon={Clock3}
        />
      </div>

      <div className="dashboard-grid">
        <section className="panel activity-panel">
          <div className="panel-heading">
            <div>
              <h3>Recent Executions</h3>
              <p>Latest automation job activities</p>
            </div>
            <Link to="/jobs" className="text-link">
              View all <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>PROCESS</th>
                  <th>ROBOT</th>
                  <th>STATUS</th>
                  <th>TIME</th>
                  <th>DURATION</th>
                </tr>
              </thead>

              <tbody>
                {jobs.map((job) => (
                  <tr key={job.name}>
                    <td className="process-name">{job.name}</td>
                    <td>{job.robot}</td>
                    <td>
                      <span className={`status status-${job.status.toLowerCase()}`}>
                        <span className="status-dot" />
                        {job.status}
                      </span>
                    </td>
                    <td>{job.time}</td>
                    <td>{job.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel quick-panel">
          <div className="panel-heading">
            <div>
              <h3>Quick Actions</h3>
              <p>Get started quickly</p>
            </div>
            <MoreHorizontal size={20} />
          </div>

          <Link to="/designer" className="quick-action">
            <div className="quick-icon blue"><Workflow size={20} /></div>
            <div>
              <strong>Build Automation</strong>
              <span>Create a new workflow</span>
            </div>
            <ArrowUpRight size={16} />
          </Link>

          <Link to="/robots" className="quick-action">
            <div className="quick-icon purple"><Bot size={20} /></div>
            <div>
              <strong>Manage Robots</strong>
              <span>View connected robots</span>
            </div>
            <ArrowUpRight size={16} />
          </Link>

          <Link to="/monitoring" className="quick-action">
            <div className="quick-icon green"><Activity size={20} /></div>
            <div>
              <strong>System Monitoring</strong>
              <span>Check system performance</span>
            </div>
            <ArrowUpRight size={16} />
          </Link>

          <Link to="/jobs" className="quick-action">
            <div className="quick-icon orange"><Play size={20} /></div>
            <div>
              <strong>Execution History</strong>
              <span>Review automation jobs</span>
            </div>
            <ArrowUpRight size={16} />
          </Link>
        </section>
      </div>

      <div className="panel system-panel">
        <div className="panel-heading">
          <div>
            <h3>System Health</h3>
            <p>Current workspace infrastructure status</p>
          </div>
          <span className="status status-completed">
            <span className="status-dot" /> All systems operational
          </span>
        </div>

        <div className="health-grid">
          {[
            ['Orchestrator', 'Operational', '99.9%'],
            ['Runtime Engine', 'Operational', '98.7%'],
            ['Queue Service', 'Operational', '99.8%'],
            ['API Gateway', 'Operational', '99.9%'],
          ].map(([name, status, uptime]) => (
            <div className="health-item" key={name}>
              <span className="health-indicator" />
              <div>
                <strong>{name}</strong>
                <span>{status}</span>
              </div>
              <b>{uptime}</b>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
