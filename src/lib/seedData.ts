function calculateEndDate(startDate: string, weeks: number): string {
  const date = new Date(startDate);
  date.setDate(date.getDate() + weeks * 7);
  return date.toISOString().slice(0, 10);
}

export function generateProjectTasks(projectStartDate: string, projectEndDate: string, projectId: string) {
  const taskDefinitions = [
    { name: 'INSTALATION DE CHANTIER', weeks: 4, owner_roles: ['Project Manager'] },
    { name: 'TERRASEMENT', weeks: 6, owner_roles: ['Construction Contractor'] },
    { name: 'FONDATIONS PRODUCTION', weeks: 12, owner_roles: ['Construction Contractor'] },
    { name: 'CHARPENTE METALLIQUE', weeks: 12, owner_roles: ['Construction Contractor'] },
    { name: 'COUVERTURE ET BARDAGE', weeks: 9, owner_roles: ['Construction Contractor'] },
    { name: 'DALLAGE', weeks: 3, owner_roles: ['Construction Contractor'] },
    { name: 'ELEVATION', weeks: 9, owner_roles: ['Construction Contractor'] },
    { name: 'PLANCHER', weeks: 6, owner_roles: ['Construction Contractor'] },
    { name: 'EQUIPEMENTS INDUSTRIELS', weeks: 3, owner_roles: ['Project Manager'] },
    { name: 'LOTS ARCHITECTUREAUX', weeks: 12, owner_roles: ['Architect'] },
    { name: 'LOTS TECHNIQUES', weeks: 6, owner_roles: ['Chief of Electronics', 'Chief of Plumbing'] },
    { name: 'AMENAGEMENT EXTERIEUR', weeks: 6, owner_roles: ['Construction Contractor'] },
  ];

  const tasks = [];
  let currentStartDate = projectStartDate;

  for (const taskDef of taskDefinitions) {
    const endDate = calculateEndDate(currentStartDate, taskDef.weeks);
    tasks.push({
      name: taskDef.name,
      owner_roles: taskDef.owner_roles,
      start_date: currentStartDate,
      end_date: endDate,
      percent_done: 0,
      status: 'On Track' as const,
      project_id: projectId,
      was_shifted: false,
      last_shift_date: null,
    });
    currentStartDate = endDate;
  }

  tasks.push({
    name: 'RECEPTION',
    owner_roles: ['Project Manager'],
    start_date: currentStartDate,
    end_date: projectEndDate,
    percent_done: 0,
    status: 'On Track' as const,
    project_id: projectId,
    was_shifted: false,
    last_shift_date: null,
  });

  return tasks;
}

export const seedTasks = generateProjectTasks(
  '2026-01-06',
  '2026-12-31',
  '00000000-0000-0000-0000-000000000001'
);
