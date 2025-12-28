export type Appointment = {
  id: string;
  technicianId: string;
  clientId?: string | null;
  ticketId?: string | null;
  reclamationId?: string | null;
  title?: string;
  notes?: string;
  status?: string;
  startUtc: string;
  endUtc: string;
};

export type ScheduleRequest = {
  technicianId: string;
  clientId?: string | null;
  ticketId?: string | null;
  reclamationId?: string | null;
  title: string;
  notes?: string | null;
  status?: string;
  startUtc: string;
  endUtc: string;
};

const BASE = 'https://localhost:7076/apigateway/calendar/appointments';

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };
  
  try {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (e) {
    console.warn('Could not retrieve token from localStorage', e);
  }
  
  return headers;
}

async function handleResponse(res: Response) {
  // Check for CORS errors first
  if (res.type === 'opaque' || res.status === 0) {
    throw new Error('Network error or CORS policy blocked the request');
  }
  
  if (res.status === 401) throw new Error('Unauthorized - Please login again');
  
  if (!res.ok) {
    let errorMessage = `HTTP ${res.status}: ${res.statusText}`;
    
    try {
      const contentType = res.headers.get('content-type');
      let errorData: any;
      
      if (contentType && contentType.includes('application/json')) {
        errorData = await res.json();
      } else {
        const text = await res.text();
        errorMessage = text || errorMessage;
        throw new Error(text || errorMessage);
      }
      
      // Parse structured error response
      if (errorData) {
        if (errorData.title) {
          errorMessage = errorData.title;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
        
        if (errorData.errors) {
          const validationErrors = Object.entries(errorData.errors)
            .map(([field, messages]) => {
              const msgArray = Array.isArray(messages) ? messages : [String(messages)];
              return `${field}: ${msgArray.join(', ')}`;
            })
            .join('; ');
          
          errorMessage += ` | ${validationErrors}`;
        } else if (errorData.message) {
          errorMessage += ` | ${errorData.message}`;
        } else if (errorData.detail) {
          errorMessage += ` | ${errorData.detail}`;
        } else if (errorData.details) {
          errorMessage += ` | ${errorData.details}`;
        }
      }
    } catch (parseError) {
      console.warn('Could not parse error response:', parseError);
    }
    
    throw new Error(errorMessage);
  }
  
  // Handle 204 No Content
  if (res.status === 204) {
    return null;
  }
  
  // Parse successful response
  try {
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await res.json();
    } else {
      const text = await res.text();
      console.warn('Response was not JSON:', text);
      throw new Error('Server returned non-JSON response');
    }
  } catch (jsonError) {
    console.warn('Could not parse JSON response:', jsonError);
    throw new Error('Invalid response format from server');
  }
}

// Helper to convert string to GUID format
const toGuid = (value: string | null | undefined): string | null => {
  if (!value) return null;
  
  const trimmed = value.trim();
  
  // If it's already a valid GUID, return it
  if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(trimmed)) {
    return trimmed;
  }
  
  // If it's a number, convert to a deterministic GUID
  const num = Number(trimmed);
  if (!isNaN(num) && Number.isInteger(num)) {
    // Create a deterministic GUID from the number
    const hex = num.toString(16).padStart(32, '0');
    const guid = `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}`;
    return guid;
  }
  
  // If it's not a GUID, return null
  return null;
};

export const calendarService = {
  getAppointments: async (technicianId: string | null, dateUtc: string): Promise<Appointment[]> => {
    const query = new URLSearchParams();
    if (technicianId) {
      query.append('technicianId', technicianId);
    }
    query.append('dateUtc', dateUtc);
    const url = `${BASE}?${query.toString()}`;
    
    const res = await fetch(url, { 
      method: 'GET',
      headers: getAuthHeaders(),
      mode: 'cors'
    });
    
    return handleResponse(res) as Promise<Appointment[]>;
  },
  
  getById: async (id: string): Promise<Appointment> => {
    const res = await fetch(`${BASE}/${encodeURIComponent(id)}`, { 
      method: 'GET',
      headers: getAuthHeaders(),
      mode: 'cors'
    });
    
    return handleResponse(res) as Promise<Appointment>;
  },
  
  create: async (payload: ScheduleRequest): Promise<Appointment> => {
    console.log('Creating appointment with payload (frontend):', payload);
    
    // Convert all IDs to GUIDs or null
    const technicianGuid = toGuid(payload.technicianId);
    if (!technicianGuid) {
      throw new Error('TechnicianId must be a valid GUID');
    }
    
    // Format the payload EXACTLY as the backend expects (PascalCase with Guid)
    const apiPayload = {
      TechnicianId: technicianGuid,
      ClientId: toGuid(payload.clientId),
      TicketId: toGuid(payload.ticketId),
      ReclamationId: toGuid(payload.reclamationId),
      Title: payload.title,
      Notes: payload.notes || null,
      Status: payload.status || 'Planned',
      StartUtc: payload.startUtc,
      EndUtc: payload.endUtc,
    };
    
    console.log('Sending to API (backend format):', apiPayload);
    
    const res = await fetch(BASE, {
      method: 'POST',
      headers: getAuthHeaders(),
      mode: 'cors',
      body: JSON.stringify(apiPayload)
    });
    
    return handleResponse(res) as Promise<Appointment>;
  },

  update: async (id: string, payload: Partial<ScheduleRequest> & { status?: string }): Promise<Appointment> => {
    if (!id) throw new Error('Appointment id is required for update');

    const apiPayload: any = {
      Id: id,
      TechnicianId: toGuid(payload.technicianId ?? null),
      ClientId: toGuid(payload.clientId ?? null),
      TicketId: toGuid(payload.ticketId ?? null),
      ReclamationId: toGuid(payload.reclamationId ?? null),
      Title: payload.title ?? null,
      Notes: payload.notes ?? null,
      Status: payload.status ?? 'Planned',
      StartUtc: payload.startUtc,
      EndUtc: payload.endUtc,
    };

    const res = await fetch(`${BASE}/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      mode: 'cors',
      body: JSON.stringify(apiPayload)
    });

    return handleResponse(res) as Promise<Appointment>;
  },
  
  delete: async (id: string): Promise<void> => {
    const res = await fetch(`${BASE}/${encodeURIComponent(id)}`, { 
      method: 'DELETE',
      headers: getAuthHeaders(),
      mode: 'cors'
    });
    
    return handleResponse(res) as Promise<void>;
  },

  // Discover which payload format the API accepts
  testApiFormat: async (): Promise<'camelCase' | 'pascalCase' | 'unknown'> => {
    const payloads = [
      {
        name: 'camelCase with wrapper',
        data: {
          request: {
            technicianId: '00000000-0000-0000-0000-000000000000',
            title: 'Test Appointment',
            startUtc: new Date().toISOString(),
            endUtc: new Date(Date.now() + 3600000).toISOString(),
          }
        }
      },
      {
        name: 'pascalCase with wrapper',
        data: {
          request: {
            TechnicianId: '00000000-0000-0000-0000-000000000000',
            Title: 'Test Appointment',
            StartUtc: new Date().toISOString(),
            EndUtc: new Date(Date.now() + 3600000).toISOString(),
          }
        }
      },
      {
        name: 'camelCase flat',
        data: {
          technicianId: '00000000-0000-0000-0000-000000000000',
          title: 'Test Appointment',
          startUtc: new Date().toISOString(),
          endUtc: new Date(Date.now() + 3600000).toISOString(),
        }
      },
      {
        name: 'pascalCase flat',
        data: {
          TechnicianId: '00000000-0000-0000-0000-000000000000',
          Title: 'Test Appointment',
          StartUtc: new Date().toISOString(),
          EndUtc: new Date(Date.now() + 3600000).toISOString(),
        }
      }
    ];

    for (const test of payloads) {
      try {
        const res = await fetch(BASE, {
          method: 'POST',
          headers: getAuthHeaders(),
          mode: 'cors',
          body: JSON.stringify(test.data)
        });

        if (res.ok) {
          return test.name.includes('camelCase') ? 'camelCase' : 'pascalCase';
        }
      } catch (err) {
        console.warn(`Test ${test.name} failed`, err);
      }
    }

    return 'unknown';
  },

  // Debug endpoint: send raw payload and return raw response
  debugEndpoint: async (payload: any): Promise<{ status: number; statusText: string; body: string; headers: Record<string, string> }> => {
    const res = await fetch(BASE, {
      method: 'POST',
      headers: getAuthHeaders(),
      mode: 'cors',
      body: JSON.stringify(payload)
    });

    const text = await res.text();
    const headers: Record<string, string> = {};
    res.headers.forEach((v, k) => { headers[k] = v; });

    return {
      status: res.status,
      statusText: res.statusText,
      body: text,
      headers
    };
  },

  // Minimal payload debug
  testMinimalPayload: async (): Promise<any> => {
    const minimalPayload = {
      TechnicianId: '00000000-0000-0000-0000-000000000000',
      Title: 'Test Minimal',
      StartUtc: new Date().toISOString(),
      EndUtc: new Date(Date.now() + 3600000).toISOString(),
    };

    return calendarService.debugEndpoint(minimalPayload);
  },
  
  // Test if the API is working
  testConnection: async (): Promise<{ success: boolean; message: string }> => {
    try {
      const testDate = new Date().toISOString();
      const testGuid = '00000000-0000-0000-0000-000000000000';
      
      const res = await fetch(`${BASE}?technicianId=${testGuid}&dateUtc=${encodeURIComponent(testDate)}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        mode: 'cors'
      });
      
      if (res.ok) {
        return { success: true, message: 'API is reachable' };
      } else {
        const text = await res.text();
        return { 
          success: false, 
          message: `API error: ${res.status} ${res.statusText} - ${text.substring(0, 100)}` 
        };
      }
    } catch (error: any) {
      return { 
        success: false, 
        message: `Connection failed: ${error.message}` 
      };
    }
  }
};

export default calendarService;