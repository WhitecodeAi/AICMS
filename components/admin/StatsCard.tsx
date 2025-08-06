import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color?: 'blue' | 'purple' | 'pink' | 'green'
  change?: string
  changeType?: 'increase' | 'decrease' | 'neutral'
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
    accent: 'border-blue-200'
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'text-purple-600',
    accent: 'border-purple-200'
  },
  pink: {
    bg: 'bg-pink-50',
    icon: 'text-pink-600',
    accent: 'border-pink-200'
  },
  green: {
    bg: 'bg-green-50',
    icon: 'text-green-600',
    accent: 'border-green-200'
  }
}

export default function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  color = 'blue',
  change,
  changeType = 'neutral'
}: StatsCardProps) {
  const colorClass = colorClasses[color]

  return (
    <div className={`${colorClass.bg} rounded-lg p-6 border-2 ${colorClass.accent}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <p className={`text-sm mt-1 ${
              changeType === 'increase' ? 'text-green-600' : 
              changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {change}
            </p>
          )}
        </div>
        <div className={`${colorClass.bg} p-3 rounded-full`}>
          <Icon className={`w-8 h-8 ${colorClass.icon}`} />
        </div>
      </div>
    </div>
  )
}
