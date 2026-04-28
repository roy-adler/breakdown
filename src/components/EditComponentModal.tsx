import { useStore } from '../store/useStore'
import { Modal } from './Modal'
import { ComponentForm } from './ComponentForm'

interface Props {
  componentId: string
  onClose: () => void
}

export function EditComponentModal({ componentId, onClose }: Props) {
  const components = useStore(s => s.components)
  const projects = useStore(s => s.projects)
  const activeProjectId = useStore(s => s.activeProjectId)
  const updateComponent = useStore(s => s.updateComponent)
  const comp = components[componentId]

  if (!comp) return null

  const availableProjects = projects
    .filter(p => p.id !== activeProjectId)
    .map(({ id, name }) => ({ id, name }))

  return (
    <Modal title="Edit Component" onClose={onClose}>
      <ComponentForm
        initial={comp}
        submitLabel="Save Changes"
        availableProjects={availableProjects}
        onSubmit={data => {
          updateComponent(componentId, data)
          onClose()
        }}
      />
    </Modal>
  )
}
