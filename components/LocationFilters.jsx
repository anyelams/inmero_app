import React from "react";
import CustomPicker from "./CustomPicker";

const LocationFilters = ({ selected, locationData, handlers }) => {
  return (
    <>
      <CustomPicker
        label="País"
        items={locationData.paises}
        selectedValue={selected.paisId}
        onValueChange={handlers.handlePaisChange}
      />

      <CustomPicker
        label="Departamento"
        items={locationData.departamentos}
        selectedValue={selected.departamentoId}
        onValueChange={handlers.handleDepartamentoChange}
        enabled={selected.paisId !== null}
      />

      <CustomPicker
        label="Municipio"
        items={locationData.municipios}
        selectedValue={selected.municipioId}
        onValueChange={handlers.handleMunicipioChange}
        enabled={selected.departamentoId !== null}
      />

      <CustomPicker
        label="Sede"
        items={locationData.sedes}
        selectedValue={selected.sedeId}
        onValueChange={handlers.handleSedeChange}
        enabled={selected.municipioId !== null}
      />

      <CustomPicker
        label="Bloque"
        items={locationData.bloques}
        selectedValue={selected.bloqueId}
        onValueChange={handlers.handleBloqueChange}
        enabled={selected.sedeId !== null}
      />

      <CustomPicker
        label="Espacio"
        items={locationData.espacios}
        selectedValue={selected.espacioId}
        onValueChange={handlers.handleEspacioChange}
        enabled={selected.bloqueId !== null}
      />

      <CustomPicker
        label="Almacén"
        items={locationData.almacenes}
        selectedValue={selected.almacenId}
        onValueChange={handlers.handleAlmacenChange}
        enabled={selected.espacioId !== null}
      />
    </>
  );
};

export default LocationFilters;
