import { useQuery, useMutation } from 'react-query'
import { Loader2, Award, Download, Trophy } from 'lucide-react'
import { eventsApi } from '@/api/events'

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  window.URL.revokeObjectURL(url)
}

export default function MyCertificates() {
  const { data: certificates, isLoading } = useQuery(
    'my-certificates',
    () => eventsApi.myCertificates().then((r) => r.data),
  )

  const downloadMutation = useMutation(
    ({ registrationId, eventTitle }: { registrationId: string; eventTitle: string }) =>
      eventsApi.downloadCertificate(registrationId).then((r) => {
        downloadBlob(r.data as Blob, `certificate_${eventTitle.replace(/\s+/g, '_')}.pdf`)
      }),
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">My Certificates</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Download your participation and winner certificates
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : !certificates?.length ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
          <Award className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="text-sm text-gray-500 mb-1">No certificates yet.</p>
          <p className="text-xs text-gray-400">
            Register and attend events to earn your certificates.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                {cert.certificate_type === 'winner' ? (
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-amber-500" />
                  </div>
                ) : (
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                    <Award className="w-5 h-5 text-blue-500" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 line-clamp-1">{cert.event_title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      cert.certificate_type === 'winner'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}>
                      {cert.certificate_type === 'winner' ? 'Winner' : 'Participant'}
                    </span>
                    {cert.position && (
                      <span className="text-xs text-gray-500">— {cert.position}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Issued {new Date(cert.issued_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  downloadMutation.mutate({
                    registrationId: cert.registration_id,
                    eventTitle: cert.event_title,
                  })
                }
                disabled={downloadMutation.isLoading}
                className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                {downloadMutation.isLoading
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Download className="w-3.5 h-3.5" />}
                Download PDF
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
