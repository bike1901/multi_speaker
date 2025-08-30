import { S3Client, ListBucketsCommand, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { NextRequest, NextResponse } from 'next/server'

const s3Client = new S3Client({
  forcePathStyle: true,
  region: process.env.S3_REGION || 'us-east-1',
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
})

export async function POST(request: NextRequest) {
  try {
    const testResults = {
      timestamp: new Date().toISOString(),
      tests: {} as any
    }

    // Test 1: List buckets
    try {
      const listBuckets = await s3Client.send(new ListBucketsCommand({}))
      testResults.tests.listBuckets = {
        success: true,
        bucketCount: listBuckets.Buckets?.length || 0,
        buckets: listBuckets.Buckets?.map(b => b.Name) || []
      }
    } catch (error: any) {
      testResults.tests.listBuckets = {
        success: false,
        error: error.message
      }
    }

    // Test 2: Upload test file
    const testKey = `test-s3-${Date.now()}.txt`
    const testContent = 'Hello from S3 compatibility test!'
    
    try {
      await s3Client.send(new PutObjectCommand({
        Bucket: process.env.S3_BUCKET || 'calls',
        Key: testKey,
        Body: testContent,
        ContentType: 'text/plain'
      }))
      
      testResults.tests.upload = {
        success: true,
        key: testKey
      }

      // Test 3: Download test file
      try {
        const getObject = await s3Client.send(new GetObjectCommand({
          Bucket: process.env.S3_BUCKET || 'calls',
          Key: testKey
        }))
        
        const downloadedContent = await getObject.Body?.transformToString()
        testResults.tests.download = {
          success: true,
          contentMatch: downloadedContent === testContent
        }
      } catch (error: any) {
        testResults.tests.download = {
          success: false,
          error: error.message
        }
      }

      // Test 4: Delete test file
      try {
        await s3Client.send(new DeleteObjectCommand({
          Bucket: process.env.S3_BUCKET || 'calls',
          Key: testKey
        }))
        
        testResults.tests.delete = {
          success: true
        }
      } catch (error: any) {
        testResults.tests.delete = {
          success: false,
          error: error.message
        }
      }

    } catch (error: any) {
      testResults.tests.upload = {
        success: false,
        error: error.message
      }
    }

    // Overall success check
    const allTestsPassed = Object.values(testResults.tests).every((test: any) => test.success)
    testResults.overall = {
      success: allTestsPassed,
      message: allTestsPassed 
        ? '✅ S3 compatibility confirmed! All tests passed.' 
        : '❌ Some tests failed. Check individual test results.'
    }

    return NextResponse.json(testResults)
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Failed to initialize S3 client. Check your environment variables.'
    }, { status: 500 })
  }
}
