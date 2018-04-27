package de.ingrid.iplug.dsc.index.mapper;

public class SkipException extends RuntimeException {
    private SkipException() {}

    public SkipException(String message) {
        super(message);
    }
}
