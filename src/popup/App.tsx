import { Container, Title, Text, Button, Stack } from '@mantine/core'
import { IconBrandChrome } from '@tabler/icons-react'

function App() {
  const handleClick = () => {
    console.log('Extension button clicked!')
  }

  return (
    <Container size="xs" p="md" style={{ width: '300px', height: '400px' }}>
      <Stack gap="md">
        <div style={{ textAlign: 'center' }}>
          <IconBrandChrome size={48} />
          <Title order={2} mt="sm">changeme</Title>
          <Text size="sm" c="dimmed">
            Your browser extension is ready!
          </Text>
        </div>
        
        <Button 
          variant="filled" 
          onClick={handleClick}
          fullWidth
        >
          Click me!
        </Button>
        
        <Text size="xs" c="dimmed" ta="center">
          Built with TypeScript, React, and Mantine
        </Text>
      </Stack>
    </Container>
  )
}

export default App