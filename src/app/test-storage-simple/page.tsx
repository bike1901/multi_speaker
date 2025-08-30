'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function SimpleStorageTest() {
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<string>('')
  const [file, setFile] = useState<File | null>(null)

  const supabase = createClient()

  const testUpload = async () => {
    if (!file) return

    setUploading(true)
    setResult('')

    try {
      console.log('Testing simple upload...')
      
      // Simple test path
      const testPath = `test-${Date.now()}.${file.name.split('.').pop()}`
      
      console.log('Upload path:', testPath)
      console.log('File details:', { name: file.name, size: file.size, type: file.type })

      const { data, error } = await supabase.storage
        .from('calls')
        .upload(testPath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (error) {
        console.error('Storage error:', error)
        setResult(`❌ Error: ${error.message}`)
      } else {
        console.log('Upload success:', data)
        setResult(`✅ Success! File uploaded to: ${data.path}`)
        
        // Test download
        const { data: urlData } = await supabase.storage
          .from('calls')
          .createSignedUrl(data.path, 60)
        
        if (urlData) {
          setResult(prev => prev + `\n📥 Download URL created: ${urlData.signedUrl}`)
        }
      }
    } catch (err) {
      console.error('Test failed:', err)
      setResult(`❌ Test failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">🔧 Simple Storage Test</h1>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Any File (for testing)
            </label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <button
            onClick={testUpload}
            disabled={!file || uploading}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-300 mb-4"
          >
            {uploading ? 'Testing...' : 'Test Simple Upload'}
          </button>

          {result && (
            <div className="p-4 bg-gray-100 rounded-lg font-mono text-sm whitespace-pre-wrap">
              {result}
            </div>
          )}

          <div className="mt-8 pt-4 border-t">
            <Link 
              href="/test-storage"
              className="text-blue-500 hover:text-blue-600 mr-4"
            >
              ← Full Storage Test
            </Link>
            <Link 
              href="/"
              className="text-blue-500 hover:text-blue-600"
            >
              Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
