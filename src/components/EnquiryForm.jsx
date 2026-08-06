import { useState } from 'react'
import { forms } from '@/data/forms'
import '@/styles/component-styles/enquiry-form.scss'

/**
 * Replaces the Contact Form 7 shortcodes. Field names, required flags and
 * placeholder copy are ported verbatim from the CF7 `_form` definitions
 * in wp_postmeta so any existing mail templates keep working.
 *
 * ⚠ There is no WordPress backend any more, so the submit handler needs a
 * form endpoint (Formspree, Netlify Forms, a Lambda, …). Set
 * VITE_FORM_ENDPOINT and this will POST to it; until then it validates
 * and reports that submission isn't wired up.
 */
export default function EnquiryForm({ formId = '6' }) {
  const definition = forms[formId] ?? forms['6']
  const [status, setStatus] = useState('idle')
  const [errors, setErrors] = useState({})

  const endpoint = import.meta.env.VITE_FORM_ENDPOINT

  const handleSubmit = async (event) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)

    const nextErrors = {}
    for (const field of definition.fields) {
      if (field.required && !String(data.get(field.name) || '').trim()) {
        nextErrors[field.name] = `${field.label} is required`
      }
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    if (!endpoint) {
      setStatus('unconfigured')
      return
    }

    setStatus('sending')
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' },
      })
      setStatus(response.ok ? 'sent' : 'error')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <div className="enquiry-form enquiry-form--sent" role="status">
        <h3>Thank you</h3>
        <p>Your enquiry is with our consultants. We&rsquo;ll be in touch shortly.</p>
      </div>
    )
  }

  return (
    <form className="enquiry-form" onSubmit={handleSubmit} noValidate>
      <div className="enquiry-form__grid">
        {definition.fields.map((field) => {
          const id = `${definition.id}-${field.name}`
          const invalid = Boolean(errors[field.name])

          return (
            <div
              key={field.name}
              className={[
                'enquiry-form__field',
                field.width === 'half' ? 'enquiry-form__field--half' : '',
                invalid ? 'is-invalid' : '',
              ].filter(Boolean).join(' ')}
            >
              <label htmlFor={id}>
                {field.label}
                {field.required && <span aria-hidden="true"> *</span>}
              </label>

              {field.type === 'textarea' ? (
                <textarea
                  id={id}
                  name={field.name}
                  rows={field.rows ?? 4}
                  placeholder={field.placeholder}
                  autoComplete={field.autoComplete}
                  aria-invalid={invalid}
                  aria-describedby={invalid ? `${id}-error` : undefined}
                />
              ) : (
                <input
                  id={id}
                  type={field.type}
                  name={field.name}
                  placeholder={field.placeholder}
                  autoComplete={field.autoComplete}
                  aria-invalid={invalid}
                  aria-describedby={invalid ? `${id}-error` : undefined}
                />
              )}

              {invalid && (
                <p className="enquiry-form__error" id={`${id}-error`}>
                  {errors[field.name]}
                </p>
              )}
            </div>
          )
        })}
      </div>

      <button type="submit" className="btn" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : definition.submitLabel}
      </button>

      {status === 'unconfigured' && (
        <p className="enquiry-form__notice" role="status">
          Form endpoint not configured — set <code>VITE_FORM_ENDPOINT</code> to
          start delivering enquiries.
        </p>
      )}
      {status === 'error' && (
        <p className="enquiry-form__notice enquiry-form__notice--error" role="alert">
          That didn&rsquo;t send. Please try again, or call us on{' '}
          <a href="tel:+441244629963">+44 (0) 1244 629 963</a>.
        </p>
      )}
    </form>
  )
}
