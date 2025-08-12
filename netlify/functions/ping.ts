export const handler = async (event: any) => {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ok: true,
      path: event.rawUrl || event.path,
      method: event.httpMethod,
    }),
  };
};
