import { useStore } from '../store/useStore'
import { Modal } from './Modal'
import { ComponentForm } from './ComponentForm'

interface Props {
  parentId: string | null
  onClose: () => void
}

export function AddComponentModal({ parentId, onClose }: Props) {
  const addComponent = useStore(s => s.addComponent)
  const projects = useStore(s => s.projects)
  const activeProjectId = useStore(s => s.activeProjectId)

  const availableProjects = projects
    .filter(p => p.id !== activeProjectId)
    .map(({ id, name }) => ({ id, name }))

  return (
    <Modal title={parentId ? 'Add Child Component' : 'Add Root Component'} onClose={onClose}>
      <ComponentForm
        submitLabel="Add Component"
        availableProjects={availableProjects}
        onSubmit={data => {
          addComponent({ ...data, parentId })
          onClose()
        }}
      />
    </Modal>
  )
}
