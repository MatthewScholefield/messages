export async function uploadToBlobse(data: ArrayBuffer): Promise<string> {
  const response = await fetch('https://blobse.us.to/blob/new', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
    },
    body: data,
  });

  const resourceUrl = await response.text();
  return resourceUrl;
}

export async function fetchFromBlobse(blobUrl: string): Promise<ArrayBuffer> {
  return await (await fetch(blobUrl)).arrayBuffer();
}
