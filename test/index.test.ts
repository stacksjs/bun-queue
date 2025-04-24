import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, mock, spyOn, test } from 'bun:test'

// Example function to test
function add(a: number, b: number): number {
  return a + b
}

// Example async function to test
async function fetchData(): Promise<string> {
  return new Promise(resolve => setTimeout(() => resolve('data'), 100))
}

// Example module to mock
const apiModule = {
  fetchUserData: async (id: number) => {
    // Simulating an API call
    return { id, name: 'John Doe', email: 'john@example.com' }
  },
}

describe('my awesome package', () => {
  let testValue: number

  beforeAll(() => {
    // eslint-disable-next-line no-console
    console.log('Running before all tests')
  })

  afterAll(() => {
    // eslint-disable-next-line no-console
    console.log('Running after all tests')
  })

  beforeEach(() => {
    testValue = 10
  })

  afterEach(() => {
    testValue = 0
  })

  it('should demonstrate basic assertion', () => {
    expect(1).toBe(1)
  })

  it('should test the add function', () => {
    expect(add(2, 3)).toBe(5)
    expect(add(-1, 1)).toBe(0)
  })

  it('should work with various matchers', () => {
    expect(true).toBeTruthy()
    expect(false).toBeFalsy()
    expect(null).toBeNull()
    expect(undefined).toBeUndefined()
    expect([1, 2, 3]).toContain(2)
    expect({ name: 'John' }).toHaveProperty('name')
    expect(() => {
      throw new Error('Test error')
    }).toThrow('Test error')
  })

  it('should handle async tests', async () => {
    const result = await fetchData()
    expect(result).toBe('data')
  })

  it('should use beforeEach and afterEach', () => {
    expect(testValue).toBe(10)
    testValue += 5
    expect(testValue).toBe(15)
  })

  test('should work with test function as well', () => {
    expect(true).toBe(true)
  })

  it('should demonstrate spy functionality', () => {
    const consoleSpy = spyOn(console, 'log')
    // eslint-disable-next-line no-console
    console.log('Test message')
    expect(consoleSpy).toHaveBeenCalledWith('Test message')
    consoleSpy.mockRestore()
  })

  it.todo('should implement this test later')

  it.skip('should skip this test', () => {
    // This test will be skipped
    expect(true).toBe(false)
  })

  describe('Mocking example', () => {
    it('should demonstrate mock functionality', async () => {
      // Create a mock function
      const mockFetchUserData = mock((id: number) => {
        return Promise.resolve({ id, name: 'Mocked User', email: 'mocked@example.com' })
      })

      // Replace the original function with the mock
      apiModule.fetchUserData = mockFetchUserData

      // Use the mocked function
      const result = await apiModule.fetchUserData(1)

      // Assert the mock was called with the correct argument
      expect(mockFetchUserData).toHaveBeenCalledWith(1)

      // Assert the mock returned the expected result
      expect(result).toEqual({ id: 1, name: 'Mocked User', email: 'mocked@example.com' })

      // Check how many times the mock was called
      expect(mockFetchUserData).toHaveBeenCalledTimes(1)

      // Reset the mock
      mockFetchUserData.mockReset()

      // Provide a new implementation for the mock
      mockFetchUserData.mockImplementation((id: number) => {
        return Promise.resolve({ id, name: 'New Mock', email: 'new@example.com' })
      })

      // Use the mock with the new implementation
      const newResult = await apiModule.fetchUserData(2)
      expect(newResult).toEqual({ id: 2, name: 'New Mock', email: 'new@example.com' })
    })
  })
})
