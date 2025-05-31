export const formatDistanceToNow = (date: Date, options?: { addSuffix?: boolean }) => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
    if (diffInSeconds < 60) {
      return options?.addSuffix ? `${diffInSeconds} seconds ago` : `${diffInSeconds} seconds`
    }
  
    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) {
      return options?.addSuffix ? `${diffInMinutes} minutes ago` : `${diffInMinutes} minutes`
    }
  
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) {
      return options?.addSuffix ? `${diffInHours} hours ago` : `${diffInHours} hours`
    }
  
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 30) {
      return options?.addSuffix ? `${diffInDays} days ago` : `${diffInDays} days`
    }
  
    const diffInMonths = Math.floor(diffInDays / 30)
    if (diffInMonths < 12) {
      return options?.addSuffix ? `${diffInMonths} months ago` : `${diffInMonths} months`
    }
  
    const diffInYears = Math.floor(diffInMonths / 12)
    return options?.addSuffix ? `${diffInYears} years ago` : `${diffInYears} years`
  }
  