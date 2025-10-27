export const cloudinaryConfig = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dwn6vznqa',
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'astracore',
  apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY || '464418611683531',
  // Note: API_SECRET should only be used server-side for security
  // 
  // Current credentials (fallback values):
  // - Cloud Name: dwn6vznqa
  // - API Key: 464418611683531
  // - API Secret: 4VEE8kkrYx-CcLLnQ7K6RF_VJrI
  // - Upload Preset: astracore
  //
  // Make sure upload preset "astracore" is set to "Unsigned" in your dashboard
};

// Debug function to log current configuration
export const logCloudinaryConfig = () => {
  console.log('Current Cloudinary Configuration:', {
    cloudName: cloudinaryConfig.cloudName,
    uploadPreset: cloudinaryConfig.uploadPreset,
    apiKey: cloudinaryConfig.apiKey,
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`
  });
};

export const uploadToCloudinary = async (file: File): Promise<string> => {
  // Log current configuration for debugging
  logCloudinaryConfig();
  
  // Validate file
  if (!file) {
    throw new Error('No file provided');
  }
  
  if (file.size === 0) {
    throw new Error('File is empty');
  }
  
  if (file.size > 10 * 1024 * 1024) { // 10MB limit
    throw new Error('File size exceeds 10MB limit');
  }
  
  console.log('File validation passed:', {
    name: file.name,
    size: file.size,
    type: file.type
  });
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', cloudinaryConfig.uploadPreset);
  formData.append('cloud_name', cloudinaryConfig.cloudName);

  // Debug FormData contents
  console.log('FormData contents:');
  for (const [key, value] of formData.entries()) {
    if (key === 'file') {
      console.log(`${key}:`, (value as File).name, (value as File).size, (value as File).type);
    } else {
      console.log(`${key}:`, value);
    }
  }

  // Add debugging
  console.log('Uploading to Cloudinary:', {
    cloudName: cloudinaryConfig.cloudName,
    uploadPreset: cloudinaryConfig.uploadPreset,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type
  });

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    console.log('Cloudinary response status:', response.status);
    console.log('Cloudinary response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cloudinary error response:', errorText);
      throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Cloudinary success response:', data);
    
    if (data.error) {
      throw new Error(data.error.message || 'Upload failed');
    }

    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to upload image: ${errorMessage}`);
  }
};

export const uploadSignatureToCloudinary = async (signatureDataUrl: string): Promise<string> => {
  try {
    console.log('Starting signature upload...');
    console.log('Data URL length:', signatureDataUrl.length);
    console.log('Data URL starts with:', signatureDataUrl.substring(0, 50) + '...');
    
    // Validate data URL
    if (!signatureDataUrl.startsWith('data:image/')) {
      throw new Error('Invalid signature data URL format');
    }
    
    // Convert data URL to blob
    const response = await fetch(signatureDataUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch data URL: ${response.status} ${response.statusText}`);
    }
    
    const blob = await response.blob();
    console.log('Blob created:', {
      size: blob.size,
      type: blob.type
    });
    
    if (blob.size === 0) {
      throw new Error('Signature blob is empty');
    }
    
    // Create a file from blob
    const file = new File([blob], 'signature.png', { type: 'image/png' });
    console.log('File created:', {
      name: file.name,
      size: file.size,
      type: file.type
    });
    
    // Upload to Cloudinary
    return await uploadToCloudinary(file);
  } catch (error) {
    console.error('Error uploading signature:', error);
    throw new Error(`Failed to upload signature: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Test function to verify Cloudinary connectivity and upload presets
export const testCloudinaryUpload = async (): Promise<{ success: boolean; error?: string; data?: any }> => {
  try {
    console.log('🔍 Testing Cloudinary upload with current configuration...');
    console.log('Cloud Name:', cloudinaryConfig.cloudName);
    console.log('Upload Preset:', cloudinaryConfig.uploadPreset);
    
    // Create a simple test image
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#00BFFF';
      ctx.fillRect(0, 0, 100, 100);
      ctx.fillStyle = '#0B1C48';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('TEST', 50, 50);
    }
    
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
      }, 'image/png');
    });
    
    const file = new File([blob], 'test-upload.png', { type: 'image/png' });
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', cloudinaryConfig.uploadPreset);
    
    console.log('📤 Attempting upload...');
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📊 Response body:', responseText);
    
    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${responseText}`
      };
    }
    
    const data = JSON.parse(responseText);
    console.log('✅ Upload successful:', data);
    
    return {
      success: true,
      data: data
    };
    
  } catch (error) {
    console.error('❌ Upload test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Function to test different upload presets
export const testUploadPresets = async (): Promise<void> => {
  const possiblePresets = [
    'astraronix_content',
    'UPLOAD1',
    'astracore',
    'astracore_content',
    'content_uploads',
    'image_uploads',
    'unsigned_upload',
    'default'
  ];
  
  console.log('🔍 Testing different upload presets...');
  
  for (const preset of possiblePresets) {
    try {
      console.log(`Testing preset: ${preset}`);
      
      // Create a proper image file (1x1 PNG) - same as successful test
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 1, 1);
      }
      
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob || new Blob());
        }, 'image/png');
      });
      
      const formData = new FormData();
      formData.append('upload_preset', preset);
      formData.append('file', blob, 'test.png');
      
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Preset "${preset}" works! Response:`, data);
        console.log(`🎯 Update your config to use: uploadPreset: '${preset}'`);
        console.log(`🔗 Uploaded file URL: ${data.secure_url}`);
        return;
      } else {
        const errorText = await response.text();
        console.log(`❌ Preset "${preset}" failed: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.log(`❌ Preset "${preset}" error:`, error);
    }
  }
  
  console.log('❌ No working upload presets found. Check your Cloudinary dashboard.');
};

// Alternative test function using FormData
export const testCloudinaryFormData = async (): Promise<boolean> => {
  try {
    // Create a simple test image
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'red';
      ctx.fillRect(0, 0, 100, 100);
    }
    
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
      }, 'image/png');
    });
    
    const file = new File([blob], 'test.png', { type: 'image/png' });
    
    // Try to upload the test file
    const result = await uploadToCloudinary(file);
    console.log('Test upload successful:', result);
    return true;
  } catch (error) {
    console.error('Test upload failed:', error);
    return false;
  }
};

// Function to test upload preset specifically
export const testUploadPreset = async (): Promise<boolean> => {
  try {
    console.log('Testing upload preset configuration...');
    
    // Test with minimal data to see if preset is working
    const formData = new FormData();
    formData.append('upload_preset', cloudinaryConfig.uploadPreset);
    formData.append('cloud_name', cloudinaryConfig.cloudName);
    formData.append('file', new Blob(['test'], { type: 'text/plain' }), 'test.txt');
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );
    
    console.log('Upload preset test response:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Upload preset test successful:', data);
      return true;
    } else {
      const errorText = await response.text();
      console.error('Upload preset test failed:', errorText);
      return false;
    }
  } catch (error) {
    console.error('Upload preset test error:', error);
    return false;
  }
};

// Function to test different cloud names
export const testCloudNames = async (): Promise<void> => {
  const possibleCloudNames = [
    'astracore',
    'astracore-solutions',
    'astracore-solutions-ltd',
    'astracore-ltd',
    'astracore-solutions-ltd',
    'astracore-solutions-ltd',
    'astracore-solutions-ltd',
    'astracore-solutions-ltd',
    'astracore-solutions-ltd',
    'astracore-solutions-ltd'
  ];
  
  console.log('Testing possible cloud names...');
  
  for (const cloudName of possibleCloudNames) {
    try {
      const response = await fetch(`https://res.cloudinary.com/${cloudName}/image/upload/v1/info.json`);
      if (response.ok) {
        console.log(`✓ Found working cloud name: ${cloudName}`);
        console.log(`Update your config to use: cloudName: '${cloudName}'`);
        return;
      }
    } catch (error) {
      // Ignore errors for this test
    }
  }
  
  console.log('No working cloud names found. Check your Cloudinary dashboard URL.');
};

// Function to check Cloudinary account details
export const checkCloudinaryAccount = async (): Promise<void> => {
  try {
    // Try to get account info (this might fail for unsigned uploads, but gives us info)
    const response = await fetch(`https://res.cloudinary.com/${cloudinaryConfig.cloudName}/image/upload/v1/info.json`);
    console.log('Account info response:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Account info:', data);
    }
  } catch (error) {
    console.log('Could not fetch account info (expected for unsigned uploads):', error);
  }
  
  // Log all configuration details
  console.log('=== Cloudinary Configuration Debug ===');
  console.log('Cloud Name:', cloudinaryConfig.cloudName);
  console.log('Upload Preset:', cloudinaryConfig.uploadPreset);
  console.log('API Key:', cloudinaryConfig.apiKey);
  console.log('Upload URL:', `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`);
  console.log('Expected Cloudinary Dashboard URL:', `https://cloudinary.com/console/media_library/folders/home/${cloudinaryConfig.cloudName}`);
  console.log('');
  console.log('=== Upload Preset Debug ===');
  console.log('Your upload preset "astracore" should be configured as:');
  console.log('- Mode: Unsigned (✓ confirmed)');
  console.log('- Folder: Any folder or specific folder');
  console.log('- Allowed formats: image/* or specific formats');
  console.log('- Max file size: Appropriate limit');
  console.log('');
  console.log('=== Troubleshooting Steps ===');
  console.log('1. Check if cloud name in URL matches:', cloudinaryConfig.cloudName);
  console.log('2. Verify upload preset "astracore" exists and is set to Unsigned');
  console.log('3. Check if upload preset is in the correct folder');
  console.log('4. Verify account has proper permissions for unsigned uploads');
  console.log('');
  console.log('=== Common Cloud Name Issues ===');
  console.log('Your dashboard shows "astracore" but the actual cloud name might be different.');
  console.log('Check your dashboard URL: https://cloudinary.com/console/media_library/folders/home/');
  console.log('The part after /home/ is your actual cloud name.');
  console.log('=====================================');
};

// New comprehensive diagnostic function
export const diagnoseCloudinaryIssue = async (): Promise<void> => {
  console.log('🔍 Starting comprehensive Cloudinary diagnosis...');
  console.log('');
  
  // Test 1: Check if cloud name is accessible
  console.log('📋 Test 1: Checking cloud name accessibility...');
  try {
    const response = await fetch(`https://res.cloudinary.com/${cloudinaryConfig.cloudName}/image/upload/v1/info.json`);
    if (response.ok) {
      console.log('✅ Cloud name "astracore" is accessible');
    } else {
      console.log('❌ Cloud name "astracore" is NOT accessible (Status:', response.status, ')');
      console.log('   This suggests the cloud name might be incorrect');
    }
  } catch (error) {
    console.log('❌ Cloud name "astracore" is NOT accessible (Error:', error, ')');
  }
  
  // Test 2: Check upload preset specifically
  console.log('');
  console.log('📋 Test 2: Testing upload preset...');
  try {
    const formData = new FormData();
    formData.append('upload_preset', cloudinaryConfig.uploadPreset);
    formData.append('cloud_name', cloudinaryConfig.cloudName);
    formData.append('file', new Blob(['test'], { type: 'text/plain' }), 'test.txt');
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Upload preset "astracore" is working correctly');
      console.log('   Response:', data);
    } else {
      const errorText = await response.text();
      console.log('❌ Upload preset "astracore" is NOT working (Status:', response.status, ')');
      console.log('   Error:', errorText);
      
      if (response.status === 401) {
        console.log('   🔍 401 Unauthorized suggests:');
        console.log('      - Upload preset name is incorrect');
        console.log('      - Upload preset is not set to "unsigned" mode');
        console.log('      - Upload preset is in a different cloud');
      }
    }
  } catch (error) {
    console.log('❌ Upload preset test failed with error:', error);
  }
  
  // Test 3: Check possible cloud name variations
  console.log('');
  console.log('📋 Test 3: Checking possible cloud name variations...');
  const possibleCloudNames = [
    'astracore',
    'astracore-solutions',
    'astracore-solutions-ltd',
    'astracore-ltd',
    'astracore-solutions-ltd',
    'astracore-solutions-ltd',
    'astracore-solutions-ltd',
    'astracore-solutions-ltd',
    'astracore-solutions-ltd',
    'astracore-solutions-ltd'
  ];
  
  // Add more common variations
  const additionalCloudNames = [
    'astracore',
    'astracore-solutions',
    'astracore-solutions-ltd',
    'astracore-ltd',
    'astracore-solutions-ltd',
    'astracore-solutions-ltd',
    'astracore-solutions-ltd',
    'astracore-solutions-ltd',
    'astracore-solutions-ltd',
    'astracore-solutions-ltd',
    // Common business variations
    'astracore-inc',
    'astracore-corp',
    'astracore-company',
    'astracore-group',
    'astracore-holdings',
    'astracore-ventures',
    'astracore-partners',
    'astracore-systems',
    'astracore-tech',
    'astracore-digital',
    // Try without dashes
    'astracore',
    'astracore',
    'astracore',
    'astracore',
    'astracore'
  ];
  
  const allCloudNames = [...new Set([...possibleCloudNames, ...additionalCloudNames])];
  
  for (const cloudName of allCloudNames) {
    try {
      const response = await fetch(`https://res.cloudinary.com/${cloudName}/image/upload/v1/info.json`);
      if (response.ok) {
        console.log(`✅ Found working cloud name: ${cloudName}`);
        console.log(`   Update your config to use: cloudName: '${cloudName}'`);
        break;
      }
    } catch (error) {
      // Ignore errors for this test
    }
  }
  
  // Test 4: Check API key format
  console.log('');
  console.log('📋 Test 4: Checking API key format...');
  const apiKey = cloudinaryConfig.apiKey;
  if (apiKey && apiKey.length > 0) {
    console.log('✅ API key is present:', apiKey);
    console.log('   Length:', apiKey.length, 'characters');
    console.log('   Format looks correct');
  } else {
    console.log('❌ API key is missing or empty');
  }
  
  // Test 5: Check upload preset configuration
  console.log('');
  console.log('📋 Test 5: Upload preset configuration check...');
  console.log('   Current upload preset:', cloudinaryConfig.uploadPreset);
  console.log('   Expected: "astracore" (must match exactly)');
  console.log('   Make sure in your Cloudinary dashboard:');
  console.log('   1. Go to Settings > Upload');
  console.log('   2. Find upload preset named exactly "astracore"');
  console.log('   3. Set signing mode to "Unsigned"');
  console.log('   4. Ensure it allows image uploads');
  
  console.log('');
  console.log('🎯 RECOMMENDED NEXT STEPS:');
  console.log('1. Go to https://cloudinary.com/console');
  console.log('2. Check the exact cloud name in your dashboard URL');
  console.log('3. Verify upload preset "astracore" exists and is set to unsigned');
  console.log('4. Update the cloudName in this config file if different');
  console.log('5. Test again with the corrected configuration');
  console.log('');
  console.log('🔍 Diagnosis complete. Check the console above for specific issues.');
};

// Simple test function that can be called from browser console
export const quickCloudinaryTest = async () => {
  console.log('🚀 Quick Cloudinary Test Starting...');
  console.log('Current Config:', cloudinaryConfig);
  
  try {
    // Test with minimal data
    const formData = new FormData();
    formData.append('upload_preset', cloudinaryConfig.uploadPreset);
    formData.append('file', new Blob(['test'], { type: 'text/plain' }), 'test.txt');
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );
    
    console.log('Response Status:', response.status);
    const responseText = await response.text();
    console.log('Response Body:', responseText);
    
    if (response.ok) {
      console.log('✅ SUCCESS! Cloudinary is working correctly.');
      const data = JSON.parse(responseText);
      console.log('Uploaded file URL:', data.secure_url);
    } else {
      console.log('❌ FAILED! Check the error above.');
      console.log('Common issues:');
      console.log('1. Upload preset name is incorrect');
      console.log('2. Upload preset is not set to "Unsigned" mode');
      console.log('3. Upload preset does not exist');
      console.log('4. Cloud name is incorrect');
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error);
  }
};

// Function to test if a specific preset works with proper image file
export const testSpecificPreset = async (presetName: string) => {
  console.log(`🧪 Testing specific preset: ${presetName}`);
  
  try {
    // Create a proper image file (1x1 PNG)
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 1, 1);
    }
    
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob || new Blob());
      }, 'image/png');
    });
    
    const formData = new FormData();
    formData.append('upload_preset', presetName);
    formData.append('file', blob, 'test.png');
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );
    
    const responseText = await response.text();
    console.log(`📊 Response for ${presetName}:`, response.status, responseText);
    
    if (response.ok) {
      console.log(`✅ SUCCESS! Preset "${presetName}" works!`);
      const result = JSON.parse(responseText);
      console.log(`🔗 Uploaded file URL: ${result.secure_url}`);
      return true;
    } else {
      console.log(`❌ FAILED! Preset "${presetName}" doesn't work.`);
      return false;
    }
  } catch (error) {
    console.error(`❌ ERROR testing ${presetName}:`, error);
    return false;
  }
};

// Function to test with actual file upload
export const testFileUpload = async (file: File) => {
  console.log(`🧪 Testing file upload with preset: ${cloudinaryConfig.uploadPreset}`);
  console.log(`📁 File details:`, {
    name: file.name,
    size: file.size,
    type: file.type
  });
  
  try {
    const formData = new FormData();
    formData.append('upload_preset', cloudinaryConfig.uploadPreset);
    formData.append('file', file);
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );
    
    const responseText = await response.text();
    console.log(`📊 Upload response:`, response.status, responseText);
    
    if (response.ok) {
      console.log(`✅ SUCCESS! File uploaded successfully!`);
      const result = JSON.parse(responseText);
      console.log(`🔗 Uploaded file URL: ${result.secure_url}`);
      return result;
    } else {
      console.log(`❌ FAILED! Upload failed.`);
      return null;
    }
  } catch (error) {
    console.error(`❌ ERROR during upload:`, error);
    return null;
  }
};

// Make it available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).testCloudinary = quickCloudinaryTest;
  (window as any).testUploadPresets = testUploadPresets;
  (window as any).testSpecificPreset = testSpecificPreset;
  (window as any).testFileUpload = testFileUpload;
}