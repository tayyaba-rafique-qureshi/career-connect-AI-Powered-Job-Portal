import EmployerLayout from '../../components/employer/EmployerLayout'
import Messages from '../applicant/Messages'

export default function EmployerMessages() {
  return (
    <EmployerLayout>
      <div className="employer-messages-page">
        <style>{`
          /* ── Cancel EmployerLayout outer padding ── */
          .employer-messages-page {
            margin: -16px;
            overflow: hidden;
          }
          @media (min-width: 768px) {
            .employer-messages-page {
              margin: -32px;
              overflow: hidden;
            }
          }

          /* ── Mobile: full-width single-column stacked layout ── */
          @media (max-width: 767px) {

            /* Root wrapper: constrain to viewport, no overflow */
            .employer-messages-page .messages-root {
              overflow-x: hidden !important;
              max-width: 100vw !important;
            }

            /* Stage: fill remaining height after 56px EmployerLayout topbar */
            .employer-messages-page .messages-stage {
              height: calc(100vh - 56px) !important;
              min-height: 0 !important;
              padding-top: 0 !important;
              overflow: hidden !important;
            }

            /* Shell: single column, no padding, no overflow */
            .employer-messages-page .messages-shell {
              flex-direction: column !important;
              padding: 0 !important;
              gap: 0 !important;
              height: 100% !important;
              max-width: 100vw !important;
              overflow-x: hidden !important;
              box-sizing: border-box !important;
            }

            /* Conversation list: full width — override inline min-width: 300px */
            .employer-messages-page .messages-left {
              width: 100% !important;
              min-width: 0 !important;
              max-width: 100% !important;
              flex-shrink: 1 !important;
              height: 45vh !important;
              border-radius: 0 !important;
              border-left: none !important;
              border-right: none !important;
              border-top: none !important;
              overflow-x: hidden !important;
              box-sizing: border-box !important;
            }

            /* Chat pane: full width */
            .employer-messages-page .messages-right {
              width: 100% !important;
              min-width: 0 !important;
              max-width: 100% !important;
              height: 55vh !important;
              border-radius: 0 !important;
              box-shadow: none !important;
              border-left: none !important;
              border-right: none !important;
              border-bottom: none !important;
              box-sizing: border-box !important;
            }

            /* Conversation rows: clip long text */
            .employer-messages-page .messages-left > div > div {
              max-width: 100% !important;
              overflow: hidden !important;
              box-sizing: border-box !important;
            }

            /* All text spans inside conversation list: ellipsis */
            .employer-messages-page .messages-left span,
            .employer-messages-page .messages-left div {
              max-width: 100% !important;
              min-width: 0 !important;
            }
          }

          /* ── Desktop: correct heights for EmployerLayout sidebar context ── */
          @media (min-width: 768px) {
            .employer-messages-page .messages-stage {
              height: calc(100vh - 0px) !important;
            }
            .employer-messages-page .messages-shell {
              padding: 20px 24px 0 !important;
            }
            .employer-messages-page .messages-left {
              height: calc(100vh - 60px) !important;
            }
            .employer-messages-page .messages-right {
              height: calc(100vh - 60px) !important;
            }
          }
        `}</style>

        <Messages showNavbar={false} />
      </div>
    </EmployerLayout>
  )
}
