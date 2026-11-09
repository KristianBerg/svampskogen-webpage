import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { Page } from '../components/Page'
import { submitWithdrawal, type WithdrawalResult } from '../lib/withdraw'

const Heading = styled.h1`
  font-size: 1.4rem;
  font-weight: normal;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 1.5rem;
`

const Intro = styled.p`
  font-size: 0.95rem;
  color: var(--color-text-secondary);
  max-width: 560px;
  line-height: 1.7;
  margin-bottom: 2rem;
`

const Form = styled.form`
  width: min(560px, 90vw);
  text-align: left;
`

const Field = styled.div`
  margin-bottom: 1.25rem;
`

const Label = styled.label`
  display: block;
  font-size: 0.85rem;
  margin-bottom: 0.3rem;
`

const Hint = styled.p`
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  margin-top: 0.3rem;
`

const inputStyles = `
  width: 100%;
  box-sizing: border-box;
  font-family: inherit;
  font-size: 0.95rem;
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text-primary);
`

const Input = styled.input`
  ${inputStyles}
`

const TextArea = styled.textarea`
  ${inputStyles}
  resize: vertical;
`

const ConfirmNotice = styled.p`
  font-size: 0.95rem;
  margin-bottom: 1rem;
`

const SubmitButton = styled.button`
  font-family: inherit;
  font-size: 0.9rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 0.75rem 2rem;
  border: 1px solid var(--color-text-primary);
  background: var(--color-text-primary);
  color: var(--color-background);
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const ErrorNotice = styled.p`
  font-size: 0.85rem;
  color: var(--color-accent);
  margin-bottom: 1rem;
`

const SuccessText = styled.p`
  max-width: 560px;
  line-height: 1.7;
  margin-bottom: 0.75rem;
`

export default function WithdrawPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage === 'sv' ? 'sv' : 'en'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [items, setItems] = useState('')
  const [orderReference, setOrderReference] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<WithdrawalResult | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)
    setResult(await submitWithdrawal({ name, email, items, orderReference, locale }))
    setIsSubmitting(false)
  }

  if (result?.ok) {
    return (
      <Page style={{ minHeight: '60vh' }}>
        <Heading>{t('withdraw_success_heading')}</Heading>
        <SuccessText>{t('withdraw_success_body', { time: result.receivedAt, email })}</SuccessText>
        <SuccessText>{t('withdraw_success_next')}</SuccessText>
      </Page>
    )
  }

  return (
    <Page style={{ minHeight: '60vh' }}>
      <Heading>{t('withdraw_heading')}</Heading>
      <Intro>{t('withdraw_intro')}</Intro>
      <Form onSubmit={(event) => void handleSubmit(event)}>
        <Field>
          <Label htmlFor="withdraw-name">{t('withdraw_name')}</Label>
          <Input id="withdraw-name" required maxLength={200} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} />
        </Field>
        <Field>
          <Label htmlFor="withdraw-email">{t('withdraw_email')}</Label>
          <Input id="withdraw-email" type="email" required maxLength={254} autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          <Hint>{t('withdraw_email_hint')}</Hint>
        </Field>
        <Field>
          <Label htmlFor="withdraw-items">{t('withdraw_items')}</Label>
          <TextArea id="withdraw-items" required rows={3} maxLength={1000} value={items} onChange={(event) => setItems(event.target.value)} />
          <Hint>{t('withdraw_items_hint')}</Hint>
        </Field>
        <Field>
          <Label htmlFor="withdraw-order">{t('withdraw_order')}</Label>
          <Input id="withdraw-order" maxLength={200} value={orderReference} onChange={(event) => setOrderReference(event.target.value)} />
        </Field>
        <ConfirmNotice>{t('withdraw_confirm_notice')}</ConfirmNotice>
        {result && <ErrorNotice role="alert">{t(`withdraw_error_${result.error}`)}</ErrorNotice>}
        <SubmitButton type="submit" disabled={isSubmitting}>
          {t('withdraw_submit')}
        </SubmitButton>
      </Form>
    </Page>
  )
}
