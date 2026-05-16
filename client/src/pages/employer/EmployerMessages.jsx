import EmployerLayout from '../../components/employer/EmployerLayout'
import Messages from '../applicant/Messages'

export default function EmployerMessages() {
  return (
    <EmployerLayout>
      <Messages showNavbar={false} />
    </EmployerLayout>
  )
}

