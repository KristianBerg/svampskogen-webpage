import styled from 'styled-components'

const Page = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
`

const Title = styled.h1`
  font-size: clamp(2.5rem, 8vw, 5rem);
  font-weight: normal;
  letter-spacing: 0.05em;
  color: var(--color-accent);
  margin-bottom: 0.5rem;
`

const Subtitle = styled.p`
  font-size: clamp(0.9rem, 2vw, 1.1rem);
  color: var(--color-text-secondary);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: 3rem;
`

const Divider = styled.hr`
  width: 4rem;
  border: none;
  border-top: 1px solid var(--color-border);
  margin: 0 auto 3rem;
`

const Opening = styled.p`
  font-size: clamp(1rem, 2.5vw, 1.25rem);
  color: var(--color-text-primary);
  margin-bottom: 0.75rem;
`

const Location = styled.p`
  font-size: 0.95rem;
  color: var(--color-text-secondary);
  margin-bottom: 3rem;
`

const Contact = styled.a`
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  text-decoration: none;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 2px;
  transition: color 0.2s, border-color 0.2s;

  &:hover {
    color: var(--color-accent);
    border-color: var(--color-accent);
  }
`

export default function App() {
  return (
    <Page>
      <Title>Svampskogen</Title>
      <Subtitle>Specialbutik för svampplockaren</Subtitle>
      <Divider />
      <Opening>Öppnar sommaren 2026</Opening>
      <Location>Malmö</Location>
      <Contact href="mailto:kristian@svampskogen.com">kristian@svampskogen.com</Contact>
    </Page>
  )
}
