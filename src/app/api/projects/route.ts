import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const priority = searchParams.get('priority');
  const status = searchParams.get('status');

  // Mock data
  const projects = [
    {
      id: 1,
      name: "Website Redesign",
      description: "Redesign the corporate website.",
      priority: "high",
      status: "in_progress",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 2,
      name: "Mobile App Launch",
      description: "Launch the new mobile app for iOS and Android.",
      priority: "medium",
      status: "planning",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 3,
      name: "Marketing Campaign",
      description: "Q4 Marketing campaign execution.",
      priority: "low",
      status: "completed",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ];

  let filteredProjects = projects;

  if (query) {
    filteredProjects = filteredProjects.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
  }
  if (priority) {
    filteredProjects = filteredProjects.filter(p => p.priority === priority);
  }
  if (status) {
    filteredProjects = filteredProjects.filter(p => p.status === status);
  }
    
  return NextResponse.json(filteredProjects);
}

export async function POST(request: Request) {
  const body = await request.json();
  const newProject = {
    id: Math.floor(Math.random() * 10000), // Mock ID
    name: body.name,
    description: body.description,
    priority: body.priority,
    status: body.status,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return NextResponse.json(newProject);
}
