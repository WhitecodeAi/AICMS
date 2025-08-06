'use client'

import { FileText, Users, Camera, MessageSquare, TrendingUp, Eye } from 'lucide-react'
import StatsCard from './StatsCard'

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Pages"
          value="566"
          icon={FileText}
          color="blue"
          change="+12% from last month"
          changeType="increase"
        />
        <StatsCard
          title="Total News"
          value="5"
          icon={TrendingUp}
          color="purple"
          change="+2 this week"
          changeType="increase"
        />
        <StatsCard
          title="Total Users"
          value="8"
          icon={Users}
          color="pink"
          change="No change"
          changeType="neutral"
        />
        <StatsCard
          title="Alumni Registration"
          value="2"
          icon={Users}
          color="green"
          change="+1 this month"
          changeType="increase"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard
          title="Photo Gallery"
          value="1"
          icon={Camera}
          color="blue"
        />
        <StatsCard
          title="Page Views"
          value="12,543"
          icon={Eye}
          color="purple"
          change="+5% today"
          changeType="increase"
        />
        <StatsCard
          title="Active Sessions"
          value="24"
          icon={Users}
          color="green"
        />
      </div>

      {/* Chat Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-12">
          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Welcome to the Chat</h3>
          <p className="text-gray-600 mb-4">Click the button below to start chatting with us!</p>
          <button className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-md font-medium transition-colors">
            Start Chat
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[
              { action: 'Page created', item: 'About Us', time: '2 hours ago' },
              { action: 'User registered', item: 'john.doe@email.com', time: '4 hours ago' },
              { action: 'Gallery updated', item: 'Computer Science Department', time: '1 day ago' },
              { action: 'Menu modified', item: 'Main Navigation', time: '2 days ago' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-2">
                <div>
                  <span className="text-sm font-medium text-gray-900">{activity.action}</span>
                  <span className="text-sm text-gray-600 ml-1">- {activity.item}</span>
                </div>
                <span className="text-sm text-gray-500">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
