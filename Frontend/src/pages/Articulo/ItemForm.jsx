import { useParams } from 'react-router-dom';
import CrearArticulo from './CrearArticulo';
import EditarArticulo from './EditarArticulo';

const ItemForm = () => {
  const { id } = useParams();
  return id ? <EditarArticulo id={id} /> : <CrearArticulo />;
};

export default ItemForm;
